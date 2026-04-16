const { sanitize } = require("@urbackend/common");
const mongoose = require("mongoose");
const { Project } = require("@urbackend/common");
const { getConnection } = require("@urbackend/common");
const { getCompiledModel } = require("@urbackend/common");
const { QueryEngine } = require("@urbackend/common");
const { validateData, validateUpdateData, aggregateSchema } = require("@urbackend/common");
const { performance } = require('perf_hooks');
const { dispatchWebhooks } = require('../utils/webhookDispatcher');
const { z } = require("zod");

const isDebug = process.env.DEBUG === 'true';

// Validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isDuplicateKeyError = (err) => {
  return err && err.code === 11000;
};

const BLOCKED_AGGREGATION_STAGES = new Set(["$out", "$merge"]);

const containsBlockedAggregationStage = (pipeline = []) => {
  return pipeline.some((stage) =>
    Object.keys(stage || {}).some((key) => BLOCKED_AGGREGATION_STAGES.has(key)),
  );
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
    res.status(201).json({
      success: true,
      data: result,
      message: "Data inserted successfully."
    });
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
    // Handle count=true query parameter
if (req.query.count === 'true') {
  const countEngine = new QueryEngine(Model.find(), req.query);
const mongoFilter = countEngine._buildMongoQuery(true);
const mergedFilter = Object.keys(baseFilter).length > 0
  ? { $and: [mongoFilter, baseFilter] }
  : mongoFilter;
  const count = await Model.countDocuments(mergedFilter);
  return res.status(200).json({ success: true, data: { count }, message: "Count fetched successfully." });
}
    const features = new QueryEngine(Model.find(), req.query)
      .filter();

    if (Object.keys(baseFilter).length > 0) {
      features.query = features.query.and([baseFilter]);
    }

    features
      .sort()
      .populate();

    const total = await features.count();

    features.paginate();

    const data = await features.query.lean();

    if (isDebug) console.log(`[DEBUG] getall took ${(performance.now() - start).toFixed(2)}ms`);
    res.status(200).json({
      success: true,
      data: {
        items: data,
        total,
        page: parseInt(req.query.page, 10) || 1,
        limit: Math.min(parseInt(req.query.limit, 10) || 50, 100)
      },
      message: "Data retrieved successfully."
    });
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

// AGGREGATE DATA
module.exports.aggregateData = async (req, res) => {
  try {
    let start;
    if (isDebug) start = performance.now();
    const { collectionName } = req.params;
    const project = req.project;

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig) {
      return res.status(404).json({
        success: false,
        data: {},
        message: "Collection not found",
      });
    }

    const { pipeline } = aggregateSchema.parse(req.body || {});

    if (containsBlockedAggregationStage(pipeline)) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "Aggregation pipeline contains blocked stage.",
      });
    }

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal,
    );

    const baseFilter =
      req.rlsFilter && typeof req.rlsFilter === "object" ? req.rlsFilter : {};
    const effectivePipeline = Object.keys(baseFilter).length > 0
      ? [{ $match: baseFilter }, ...pipeline]
      : pipeline;

    const data = await Model.aggregate(effectivePipeline);

    if (isDebug) console.log(`[DEBUG] aggregate took ${(performance.now() - start).toFixed(2)}ms`);
    return res.status(200).json({
      success: true,
      data,
      message: "Aggregation executed successfully.",
    });
  } catch (err) {
    console.error(err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        data: {},
        message: err.issues?.[0]?.message || "Invalid aggregation payload.",
      });
    }

    return res.status(500).json({
      success: false,
      data: {},
      message: err.message || "Failed to execute aggregation.",
    });
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
