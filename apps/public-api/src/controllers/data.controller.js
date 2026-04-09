const { sanitize } = require("@urbackend/common");
const mongoose = require("mongoose");
const { Project } = require("@urbackend/common");
const { getConnection } = require("@urbackend/common");
const { getCompiledModel } = require("@urbackend/common");
const { QueryEngine } = require("@urbackend/common");
const { validateData, validateUpdateData } = require("@urbackend/common");
const { performance } = require('perf_hooks');
const { dispatchWebhooks } = require('../utils/webhookDispatcher');

const isDebug = process.env.DEBUG === 'true';

// Validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isDuplicateKeyError = (err) => {
  return err && err.code === 11000;
};

// INSERT DATA
module.exports.insertData = async (req, res) => {
  try {
    let start;
    if (isDebug) start = performance.now();
    const { collectionName } = req.params;
    const project = req.project;

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig)
      return res.status(404).json({ error: "Collection not found" });

    const schemaRules = collectionConfig.model;
    const incomingData = req.body;

    // Recursive validation for all field types
    const { error, cleanData } = validateData(incomingData, schemaRules);
    if (error) return res.status(400).json({ error });

    const safeData = sanitize(cleanData);

    let docSize = 0;
    if (!project.resources.db.isExternal) {
      docSize = Buffer.byteLength(JSON.stringify(safeData));
      if ((project.databaseUsed || 0) + docSize > project.databaseLimit) {
        return res.status(403).json({ error: "Database limit exceeded." });
      }
    }

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal,
    );

    const result = await Model.create(safeData);

    if (!project.resources.db.isExternal) {
      await Project.updateOne(
        { _id: project._id },
        { $inc: { databaseUsed: docSize } },
      );
    }

    // Fire-and-forget webhook dispatch
    dispatchWebhooks({
      projectId: project._id,
      collection: collectionName,
      action: 'insert',
      document: result.toObject ? result.toObject() : result,
      documentId: result._id,
    });

    if (isDebug) console.log(`[DEBUG] insert data took ${(performance.now() - start).toFixed(2)}ms`);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);

    if (isDuplicateKeyError(err)) {
      return res.status(409).json({
        error: "Duplicate value violates unique constraint.",
        details: err.message,
      });
    }

    res.status(500).json({ error: err.message });
  }
};

// GET ALL DATA
module.exports.getAllData = async (req, res) => {
  try {
    let start;
    if (isDebug) start = performance.now();
    const { collectionName } = req.params;
    const project = req.project;

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig)
      return res.status(404).json({ error: "Collection not found" });

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal,
    );

    const baseFilter = req.rlsFilter && typeof req.rlsFilter === 'object' ? req.rlsFilter : {};
    const features = new QueryEngine(Model.find(), req.query)
      .filter();

    if (Object.keys(baseFilter).length > 0) {
      features.query = features.query.and([baseFilter]);
    }

    features
      .sort()
      .populate()
      .paginate();

    const data = await features.query.lean();
    if (isDebug) console.log(`[DEBUG] getall took ${(performance.now() - start).toFixed(2)}ms`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE DOC
module.exports.getSingleDoc = async (req, res) => {
  try {
    const { collectionName, id } = req.params;
    const project = req.project;

    // ensure valid mongose objct id
    if (!isValidId(id))
      return res.status(400).json({ error: "Invalid ID format." });

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig)
      return res.status(404).json({ error: "Collection not found" });

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal,
    );

    const baseFilter = req.rlsFilter && typeof req.rlsFilter === 'object' ? req.rlsFilter : {};
    let query = Model.findOne({ $and: [{ _id: id }, baseFilter] });

    // Handle population for single doc
    const rawPopulateParam = req.query.populate || req.query.expand;
    if (rawPopulateParam) {
      const populateParam = Array.isArray(rawPopulateParam) ? rawPopulateParam.join(',') : String(rawPopulateParam);
      const fields = populateParam.split(',').map(f => f.trim()).filter(Boolean);
      fields.forEach(f => {
        query = query.populate(f);
      });
    }

    const doc = await query.lean();
    if (!doc) return res.status(404).json({ error: "Document not found." });

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE DATA
module.exports.updateSingleData = async (req, res) => {
  try {
    const { collectionName, id } = req.params;
    const project = req.project;
    const incomingData = req.body;

    if (!isValidId(id))
      return res.status(400).json({ error: "Invalid ID format." });

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig)
      return res.status(404).json({ error: "Collection not found" });

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal,
    );

    // Recursive validation for all field types
    const schemaRules = collectionConfig.model;
    const { error: validationError, updateData } = validateUpdateData(
      incomingData,
      schemaRules,
    );
    if (validationError)
      return res.status(400).json({ error: validationError });

    const sanitizedData = sanitize(updateData);

    const result = await Model.findByIdAndUpdate(
      id,
      { $set: sanitizedData },
      { new: true, runValidators: true },
    ).lean();

    if (!result) return res.status(404).json({ error: "Document not found." });

    // Fire-and-forget webhook dispatch
    dispatchWebhooks({
      projectId: project._id,
      collection: collectionName,
      action: 'update',
      document: result,
      documentId: result._id,
    });

    res.json({ message: "Updated", data: result });
  } catch (err) {
    console.error(err);

    if (isDuplicateKeyError(err)) {
      return res.status(409).json({
        error: "Duplicate value violates unique constraint.",
        details: err.message,
      });
    }

    res.status(500).json({ error: err.message });
  }
};

// DELETE DATA
module.exports.deleteSingleDoc = async (req, res) => {
  try {
    const { collectionName, id } = req.params;
    const project = req.project;

    if (!isValidId(id))
      return res.status(400).json({ error: "Invalid ID format." });

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig)
      return res.status(404).json({ error: "Collection not found" });

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal,
    );

    const docToDelete = await Model.findById(id);
    if (!docToDelete)
      return res.status(404).json({ error: "Document not found." });

    // Capture document data before deletion for webhook
    const deletedDoc = docToDelete.toObject ? docToDelete.toObject() : { ...docToDelete._doc };

    let docSize = 0;
    if (!project.resources.db.isExternal) {
      docSize = Buffer.byteLength(JSON.stringify(docToDelete));
    }

    await Model.deleteOne({ _id: id });

    if (!project.resources.db.isExternal) {
      let databaseUsed = Math.max(0, (project.databaseUsed || 0) - docSize);
      await Project.updateOne({ _id: project._id }, { $set: { databaseUsed } });
    }

    // Fire-and-forget webhook dispatch
    dispatchWebhooks({
      projectId: project._id,
      collection: collectionName,
      action: 'delete',
      document: deletedDoc,
      documentId: id,
    });

    res.json({ message: "Document deleted", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
