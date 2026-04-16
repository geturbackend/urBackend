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

// INSERT BULK DATA
module.exports.insertBulkData = async (req, res) => {
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
    const incomingDataArray = req.body;

    if (!Array.isArray(incomingDataArray)) {
      return res.status(400).json({ error: "Payload must be an array of objects." });
    }

    if (incomingDataArray.length === 0) {
      return res.status(400).json({ error: "Payload array cannot be empty." });
    }

    const validDataToInsert = [];
    const errors = [];
    const validIndicesMap = new Map();

    for (let i = 0; i < incomingDataArray.length; i++) {
        const item = incomingDataArray[i];
        
        if (typeof item !== 'object' || Array.isArray(item) || item === null) {
            errors.push({ index: i, error: "Item must be a JSON object" });
            continue;
        }

        const { error, cleanData } = validateData(item, schemaRules);
        if (error) {
            errors.push({ index: i, error });
        } else {
            const safeData = sanitize(cleanData);
            validDataToInsert.push(safeData);
            validIndicesMap.set(validDataToInsert.length - 1, i);
        }
    }

    if (validDataToInsert.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: "All documents failed validation.", 
            errors,
            insertedCount: 0,
            insertedData: []
        });
    }

    let batchDocSize = 0;
    if (!project.resources.db.isExternal) {
      batchDocSize = Buffer.byteLength(JSON.stringify(validDataToInsert));
      if ((project.databaseUsed || 0) + batchDocSize > project.databaseLimit) {
        return res.status(403).json({ error: "Database limit exceeded. Additional size: " + batchDocSize + " bytes." });
      }
    }

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal,
    );

    let insertedData = [];
    try {
        insertedData = await Model.insertMany(validDataToInsert, { ordered: false });
    } catch (err) {
        if (err.name === 'MongoBulkWriteError' || err.code === 11000 || err.name === 'BulkWriteError') {
            insertedData = err.insertedDocs || [];
            if (err.writeErrors) {
                for (const writeErr of err.writeErrors) {
                    const originalIndex = validIndicesMap.get(writeErr.index);
                    errors.push({ 
                        index: originalIndex !== undefined ? originalIndex : -1, 
                        error: writeErr.errmsg || err.message 
                    });
                }
            } else if (err.message) {
               // Fallback if writeErrors not populated but it's a duplicate error
               errors.push({ index: -1, error: err.message });
            }
        } else {
            throw err;
        }
    }

    let actualInsertedSize = 0;
    if (!project.resources.db.isExternal && insertedData.length > 0) {
        const plainDocs = insertedData.map(doc => doc.toObject ? doc.toObject() : doc);
        actualInsertedSize = Buffer.byteLength(JSON.stringify(plainDocs));
        
        await Project.updateOne(
            { _id: project._id },
            { $inc: { databaseUsed: actualInsertedSize } },
        );
    }

    // Fire-and-forget webhook dispatch for each successfully inserted document
    for (const doc of insertedData) {
        const plainDoc = doc.toObject ? doc.toObject() : doc;
        dispatchWebhooks({
            projectId: project._id,
            collection: collectionName,
            action: 'insert',
            document: plainDoc,
            documentId: plainDoc._id,
        });
    }

    if (isDebug) console.log(`[DEBUG] insertBulkData took ${(performance.now() - start).toFixed(2)}ms`);

    const status = errors.length > 0 ? 207 : 201;

    return res.status(status).json({
        success: errors.length === 0,
        message: errors.length > 0 ? "Partial success or validation errors occurred." : "All documents inserted successfully.",
        insertedCount: insertedData.length,
        errors: errors.sort((a, b) => a.index - b.index),
        insertedData: insertedData,
    });

  } catch (err) {
    console.error(err);
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
    
    res.json({
      success: true,
      data: {
        items: data,
        total,
        page: parseInt(req.query.page, 10) || 1,
        limit: Math.min(parseInt(req.query.limit, 10) || 50, 100)
      },
      message: "Data fetched successfully"
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
    if (!(err instanceof z.ZodError) && process.env.NODE_ENV !== 'test') {
      console.error(err);
    }

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
