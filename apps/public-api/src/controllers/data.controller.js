const { sanitize } = require("@urbackend/common");
const mongoose = require("mongoose");
const { Project } = require("@urbackend/common");
const { getConnection } = require("@urbackend/common");
const { getCompiledModel } = require("@urbackend/common");
const { QueryEngine } = require("@urbackend/common");
const { validateData, validateUpdateData, aggregateSchema, webhookQueue } = require("@urbackend/common");
const { performance } = require('perf_hooks');
const { z } = require("zod");
const {
  AppError,
  enqueueCollectionCleanup,
  syncCollectionCleanup
} = require("@urbackend/common");

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

    // Prevent manual injection of soft-delete fields
    delete cleanData.isDeleted;
    delete cleanData.deletedAt;

    const safeData = sanitize(cleanData);

    let docSize = 0;
    if (!project.resources.db.isExternal) {
      const docForSize = safeData._id
        ? safeData
        : { ...safeData, _id: new mongoose.Types.ObjectId() };
      docSize = mongoose.mongo.BSON.calculateObjectSize(docForSize);
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

    await webhookQueue.add('trigger-webhook', {
      projectId: project._id,
      event: 'document.inserted',
      collection: collectionName,
      payload: result.toObject ? result.toObject() : result
    }, { removeOnComplete: true });

    if (isDebug) console.log(`[DEBUG] insert data took ${(performance.now() - start).toFixed(2)}ms`);
    res.status(201).json(result);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(err);
    }

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
      return next(new AppError(400, "Request body must be an array of objects"));
    }

    if (incomingData.length === 0) {
      return next(new AppError(400, "Request body cannot be empty"));
    }

    if (incomingData.length > MAX_BULK_INSERT_LIMIT) {
      return next(
        new AppError(400, `Maximum ${MAX_BULK_INSERT_LIMIT} records allowed`)
      );
    }

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName
    );

    if (!collectionConfig) {
      return next(new AppError(404, "Collection not found"));
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
        // Prevent manual injection of soft-delete fields
        delete cleanData.isDeleted;
        delete cleanData.deletedAt;

        validData.push(sanitize({
          ...cleanData,
          isDeleted: false,
          deletedAt: null
        }));
      }
    });

    if (invalidIndices.length > 0) {
      return next(
        new AppError(400, `Invalid records at index: ${invalidIndices.join(", ")}`)
      );
    }

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal
    );
    let totalDocSize = 0;

    if (!project.resources.db.isExternal) {
      for (const data of validData) {
        const docForSize = data._id
          ? data
          : { ...data, _id: new mongoose.Types.ObjectId() };

        totalDocSize += mongoose.mongo.BSON.calculateObjectSize(docForSize);
      }

      if ((project.databaseUsed || 0) + totalDocSize > project.databaseLimit) {
        return next(
          new AppError(403, "Database limit exceeded.")
        );
      }
    }

    const result = await Model.insertMany(validData, { ordered: true });

    if (!project.resources.db.isExternal) {
      await Project.updateOne(
        { _id: project._id },
        { $inc: { databaseUsed: totalDocSize } }
      );
    }

    return res.status(201).json({
      success: true,
      data: {
        insertedCount: result.length,
      },
      message: "Bulk insert successful",
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(err);
    }

    if (isDuplicateKeyError(err)) {
      return next(
        new AppError(409, "Duplicate value violates unique constraint.")
      );
    }

    return next(new AppError(500, "Failed to insert bulk data"));
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

    if (!collectionConfig) {
      return res.status(404).json({
        success: false,
        data: {},
        message: "Collection not found",
      });
    }

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

   features.sort().limitFields().populate();

    const total = await features.count();
    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = Math.max(1, Math.min(Number.isNaN(parsedLimit) ? 100 : parsedLimit, 100));

    const useCursor = !!req.query.cursor;
    if (useCursor) {
      features.cursorPaginate();
    } else {
      features.paginate();
    }

    const data = await features.query.lean();

    let items = data;
    let nextCursor = null;
    if (useCursor) {

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
        limit,
      }
      : {
        total,
        page: parseInt(req.query.page, 10) || 1,
        limit,
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
    if (process.env.NODE_ENV !== 'test') {
      console.error(err);
    }

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

    // Soft delete filter
    const includeDeleted = req.query.include_deleted === 'true';
    const softDeleteFilter = includeDeleted ? {} : { isDeleted: { $ne: true } };

    let query = Model.findOne({ $and: [{ _id: id }, baseFilter, softDeleteFilter] });

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
    if (process.env.NODE_ENV !== 'test') {
      console.error(err);
    }
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

    const includeDeleted = req.query?.include_deleted === 'true';
    const softDeleteFilter = includeDeleted ? {} : { isDeleted: { $ne: true } };

    const filter = { ...baseFilter, ...softDeleteFilter };

    // $geoNear and $search must be the first stage in the pipeline if present
    let effectivePipeline = [];
    const firstStage = pipeline.length > 0 ? Object.keys(pipeline[0])[0] : null;

    if (firstStage === '$geoNear' || firstStage === '$search') {
      effectivePipeline = [
        pipeline[0],
        { $match: filter },
        ...pipeline.slice(1)
      ];
    } else {
      effectivePipeline = [
        { $match: filter },
        ...pipeline
      ];
    }

    const data = await Model.aggregate(effectivePipeline);

    if (isDebug) console.log(`[DEBUG] aggregate took ${(performance.now() - start).toFixed(2)}ms`);

    return res.status(200).json({
      success: true,
      data,
      message: "Aggregation executed successfully.",
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
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
module.exports.updateSingleData = async (req, res, next) => {
  try {
    const { collectionName, id } = req.params;
    const project = req.project;
    const incomingData = req.body;

    if (!isValidId(id))
      return next(new AppError(400, "Invalid ID format."));

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig)
      return next(new AppError(404, "Collection not found"));

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
      return next(new AppError(400, validationError));

    // Prevent manual injection of soft-delete fields
    delete updateData.isDeleted;
    delete updateData.deletedAt;

    const sanitizedData = sanitize(updateData);

    const baseFilter = req.rlsFilter && typeof req.rlsFilter === 'object' ? req.rlsFilter : {};
    const queryFilter = { $and: [{ _id: id }, { isDeleted: { $ne: true } }, baseFilter] };

    let result;

    // Only enforce quota for internal databases
    if (!project.resources.db.isExternal) {
      // 1. Fetch existing doc securely
      const existingDoc = await Model.findOne(queryFilter).lean();
      if (!existingDoc) {
        return next(new AppError(404, "Document not found."));
      }

      // 2. Calculate sizes
      const oldSize = mongoose.mongo.BSON.calculateObjectSize(existingDoc);
      const simulatedNewDoc = { ...existingDoc, ...sanitizedData };
      const newSize = mongoose.mongo.BSON.calculateObjectSize(simulatedNewDoc);
      const sizeDelta = newSize - oldSize;

      // 3. Enforce quota if size is increasing
      if (sizeDelta > 0) {
        if ((project.databaseUsed || 0) + sizeDelta > project.databaseLimit) {
          return next(new AppError(403, "Storage quota exceeded. Please upgrade your plan."));
        }
      }

      // 4. Update the document
      result = await Model.findOneAndUpdate(
        queryFilter,
        { $set: sanitizedData },
        { new: true, runValidators: true },
      ).lean();

      // 5. Apply the delta (positive or negative) atomically
      await Project.findByIdAndUpdate(
        project._id,
        { $inc: { databaseUsed: sizeDelta } }
      );
    } else {
      // External DB Flow (No quota checks)
      result = await Model.findOneAndUpdate(
        queryFilter,
        { $set: sanitizedData },
        { new: true, runValidators: true },
      ).lean();

      if (!result) return next(new AppError(404, "Document not found."));
    }

    await webhookQueue.add('trigger-webhook', {
      projectId: project._id,
      event: 'document.updated',
      collection: collectionName,
      payload: result
    }, { removeOnComplete: true });

    res.json({ success: true, data: result, message: "Updated" });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(err);
    }

    if (isDuplicateKeyError(err)) {
      return next(new AppError(409, "Duplicate value violates unique constraint."));
    }

    return next(new AppError(500, err.message));
  }
};

/**
 * Soft-deletes a single document by its ID (moves it to trash).
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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

    const result = await Model.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true }, ...(req.rlsFilter || {}) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { new: false } // return the original document for webhook
    ).lean();

    if (!result)
      return res.status(404).json({ error: "Document not found." });

    // We don't decrement databaseUsed here because the document still occupies space.
    // It will be decremented during hard delete in the background worker.
    try {
      await enqueueCollectionCleanup(project._id, collectionName);
    } catch (err) {
      console.error("Failed to enqueue trash cleanup job", { projectId: String(project._id), collectionName, err });
    }

    await webhookQueue.add('trigger-webhook', {
      projectId: project._id,
      event: 'document.deleted',
      collection: collectionName,
      payload: result
    }, { removeOnComplete: true });

    res.json({ success: true, data: { id }, message: "Document moved to trash" });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(err);
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Recovers a single soft-deleted document from trash.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 */
module.exports.recoverSingleDoc = async (req, res, next) => {
  try {
    const { collectionName, id } = req.params;
    const project = req.project;

    if (!isValidId(id)) {
      return next(new AppError(400, "Invalid document ID format."));
    }

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig) {
      return next(new AppError(404, "Collection not found"));
    }

    const connection = await getConnection(project._id);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      project._id,
      project.resources.db.isExternal,
    );

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Model.findOneAndUpdate(
      {
        _id: id,
        isDeleted: true,
        deletedAt: { $gte: thirtyDaysAgo },
        ...(req.rlsFilter || {})
      },
      {
        $set: {
          isDeleted: false,
          deletedAt: null
        }
      },
      { new: true }
    ).lean();

    if (!result) {
      return next(new AppError(404, "Document not found or recovery window expired (30 days)."));
    }

    await webhookQueue.add('trigger-webhook', {
      projectId: project._id,
      event: 'document.recovered',
      collection: collectionName,
      payload: result
    }, { removeOnComplete: true });

    try {
      await syncCollectionCleanup(project._id, collectionName);
    } catch (err) {
      console.error("Failed to sync trash cleanup job after recovery", { projectId: String(project._id), collectionName, err });
    }

    res.json({ success: true, data: result, message: "Document recovered from trash" });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(err);
    }
    if (isDuplicateKeyError(err)) {
      return next(new AppError(409, "Cannot restore document: a unique field value conflicts with an existing active document."));
    }
    return next(new AppError(500, "Failed to recover document."));
  }
};
