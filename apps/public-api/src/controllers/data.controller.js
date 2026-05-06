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
const { AppError } = require("@urbackend/common");

const isDebug = process.env.DEBUG === 'true';

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

// BULK INSERT DATA

  module.exports.bulkInsertData = async (req, res, next) => {
  try {
    const MAX_BULK_INSERT_LIMIT = 100;

    const { collectionName } = req.params;
    const project = req.project;
    const incomingData = req.body;

    if (!Array.isArray(incomingData)) {
      return next(new AppError("Request body must be an array of objects", 400));
    }

    if (incomingData.length === 0) {
      return next(new AppError("Request body cannot be empty", 400));
    }

    if (incomingData.length > MAX_BULK_INSERT_LIMIT) {
      return next(
        new AppError(`Maximum ${MAX_BULK_INSERT_LIMIT} records allowed`, 400)
      );
    }

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName
    );

    if (!collectionConfig) {
      return next(new AppError("Collection not found", 404));
    }

    const schemaRules = collectionConfig.model;

    const validData = [];
    const invalidIndices = [];

    incomingData.forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        invalidIndices.push(index);
        return;
      }

      const { error, cleanData } = validateData(item, schemaRules);

      if (error) {
        invalidIndices.push(index);
      } else {
        validData.push(sanitize(cleanData));
      }
    });

    if (invalidIndices.length > 0) {
      return next(
        new AppError(`Invalid records at index: ${invalidIndices.join(", ")}`, 400)
      );
    }

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal
    );

    const result = await Model.insertMany(validData, { ordered: true });

    return res.status(201).json({
      success: true,
      data: {
        insertedCount: result.length,
      },
      message: "Bulk insert successful",
    });
  } catch (err) {
  console.error(err);

  if (isDuplicateKeyError(err)) {
    return next(
      new AppError("Duplicate value violates unique constraint.", 409)
    );
  }

  return next(new AppError("Failed to insert bulk data", 500));
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

    if (req.query.count === 'true') {
      const countEngine = new QueryEngine(Model.find(), req.query);
      const mongoFilter = countEngine._buildMongoQuery(true);
      const mergedFilter = Object.keys(baseFilter).length > 0
        ? { $and: [mongoFilter, baseFilter] }
        : mongoFilter;

      const countQuery = Model.countDocuments(mergedFilter);

      if (countEngine.hasRegexFilter && countQuery && typeof countQuery.maxTimeMS === 'function') {
        countQuery.maxTimeMS(QueryEngine.REGEX_MAX_TIME_MS);
      }

      const count = await countQuery;

      return res.status(200).json({
        success: true,
        data: { count },
        message: "Count fetched successfully.",
      });
    }

    const features = new QueryEngine(Model.find(), req.query).filter();

    if (Object.keys(baseFilter).length > 0) {
      features.query = features.query.and([baseFilter]);
    }

    features.sort().populate();

    const total = await features.count();

    // Use cursor-based pagination if cursor parameter is provided, otherwise use offset-based
    const useCursor = !!req.query.cursor;
    if (useCursor) {
      features.cursorPaginate();
    } else {
      features.paginate();
    }

    const data = await features.query.lean();

    // Handle cursor pagination: slice to actual limit and generate next cursor
    let items = data;
    let nextCursor = null;
    if (useCursor) {
      const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100);
      features.generateNextCursor(data, limit);
      items = data.slice(0, limit);
      nextCursor = features.nextCursor;
    }

    if (isDebug) console.log(`[DEBUG] getall took ${(performance.now() - start).toFixed(2)}ms`);

    const responseMeta = useCursor
      ? {
          total,
          cursor: req.query.cursor || null,
          nextCursor,
          limit: Math.max(1, Math.min(parseInt(req.query.limit, 10) || 100, 100)),
        }
      : {
          total,
          page: parseInt(req.query.page, 10) || 1,
          limit: Math.max(1, Math.min(parseInt(req.query.limit, 10) || 100, 100)),
        };

    res.json({
      success: true,
      data: {
        items,
        ...responseMeta,
      },
      message: "Data fetched successfully",
    });
  } catch (err) {
    console.error(err);

    if (err && (err.statusCode === 400 || err.name === 'QueryFilterError')) {
      return res.status(400).json({
        success: false,
        data: {},
        message: err.message || "Invalid query filter.",
      });
    }

    res.status(500).json({
      success: false,
      data: {},
      message: "Failed to fetch data.",
    });
  }
};

// GET SINGLE DOC
module.exports.getSingleDoc = async (req, res) => {
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

    const baseFilter = req.rlsFilter && typeof req.rlsFilter === 'object' ? req.rlsFilter : {};
    let query = Model.findOne({ $and: [{ _id: id }, baseFilter] });

    if (req.query.fields) {
      query = query.select(req.query.fields.split(',').join(' '));
    } else {
      query = query.select('-__v');
    }

    if (req.query.meta === 'false') {
      query = query.select('-schemaVersion -createdAt -updatedAt -__v');
    }

    const rawPopulateParam = req.query.populate || req.query.expand;

    if (rawPopulateParam) {
      const populateParam = Array.isArray(rawPopulateParam)
        ? rawPopulateParam.join(',')
        : String(rawPopulateParam);

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

    const deletedDoc = docToDelete.toObject
      ? docToDelete.toObject()
      : { ...docToDelete._doc };

    let docSize = 0;

    if (!project.resources.db.isExternal) {
      docSize = Buffer.byteLength(JSON.stringify(docToDelete));
    }

    await Model.deleteOne({ _id: id });

    if (!project.resources.db.isExternal) {
      let databaseUsed = Math.max(0, (project.databaseUsed || 0) - docSize);
      await Project.updateOne({ _id: project._id }, { $set: { databaseUsed } });
    }

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