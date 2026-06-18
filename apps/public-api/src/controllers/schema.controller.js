const {
  Project,
  createSchemaApiKeySchema,
  deleteProjectById,
  setProjectById,
  deleteProjectByApiKeyCache,
  getConnection,
  getCompiledModel,
  clearCompiledModel,
  createUniqueIndexes,
  generateApiKey,
  AppError,
  ApiResponse,
} = require("@urbackend/common");
const { z } = require("zod");

const isNamespaceNotFoundError = (err) => {
  return err && (err.code === 26 || /ns not found/i.test(err.message));
};

const dropCollectionIfExists = async (connection, collectionName) => {
  try {
    await connection.db.dropCollection(collectionName);
  } catch (err) {
    if (!isNamespaceNotFoundError(err)) {
      throw err;
    }
  }
};

module.exports.checkSchema = async (req, res, next) => {
  try {
    const { collectionName } = req.params;
    const project = req.project;

    if (!project) {
      return next(new AppError(401, "Project missing from request."));
    }

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );

    if (!collectionConfig) {
      return next(new AppError(404, "Schema/Collection not found"));
    }

    return new ApiResponse({ collection: collectionConfig }, "Schema exists").send(res, 200);
  } catch (err) {
    console.error(err);
    return next(new AppError(500, err.message));
  }
};

module.exports.createSchema = async (req, res, next) => {
  let fullProject;
  let connection;
  let compiledCollectionName;
  let collectionWasPersisted = false;
  let collectionNameForRollback;
  let collectionExistedBefore = false;

  try {
    const { name, fields } = createSchemaApiKeySchema.parse(req.body);
    collectionNameForRollback = name;
    const project = req.project;
    if (!project) {
      return next(new AppError(401, "Project missing from request."));
    }

    const projectId = project._id;
    fullProject = await Project.findById(projectId);

    if (!fullProject)
      return next(new AppError(404, "Project not found"));

    const exists = fullProject.collections.find((c) => c.name === name);
    if (exists)
      return next(new AppError(400, "Collection/Schema already exists"));

    if (!fullProject.jwtSecret) {
      fullProject.jwtSecret = generateApiKey("jwt_");
    }

    const UNIQUE_SUPPORTED_TYPES = new Set([
      "String",
      "Number",
      "Boolean",
      "Date",
    ]);
    // Recursive field transformer (API uses 'name', internal uses 'key')
    function transformField(f, depth = 0) {
      const mappedType =
        f.type.charAt(0).toUpperCase() + f.type.slice(1).toLowerCase();

      const wantsUnique = f.unique === true;
      const isTopLevel = depth === 0;
      const isSupportedUniqueType = UNIQUE_SUPPORTED_TYPES.has(mappedType);

      if (wantsUnique && (!isTopLevel || !isSupportedUniqueType)) {
        throw new AppError(400,
          `Field '${f.name}' can only use unique=true on top-level String, Number, Boolean, or Date fields.`
        );
      }

      const mapped = {
        key: f.name,
        type: mappedType,
        required: f.required === true,
        unique: wantsUnique,
      };

      if (f.ref) mapped.ref = f.ref;

      if (f.items) {
        mapped.items = {
          type:
            f.items.type.charAt(0).toUpperCase() +
            f.items.type.slice(1).toLowerCase(),
        };

        if (f.items.fields) {
          mapped.items.fields = f.items.fields.map((sf) =>
            transformField(sf, depth + 1),
          );
        }
      }

      if (f.fields) {
        mapped.fields = f.fields.map((sf) => transformField(sf, depth + 1));
      }

      return mapped;
    }

    const transformedFields = (fields || []).map((f) => transformField(f));

    compiledCollectionName = fullProject.resources.db.isExternal
      ? name
      : `${fullProject._id}_${name}`;

    const newCollectionConfig = {
      name,
      model: transformedFields,
    };

    fullProject.collections.push(newCollectionConfig);
    await fullProject.save();
    collectionWasPersisted = true;

    connection = await getConnection(fullProject._id);

    collectionExistedBefore = await connection.db
      .listCollections({ name: compiledCollectionName }, { nameOnly: true })
      .hasNext();

    const Model = getCompiledModel(
      connection,
      newCollectionConfig,
      fullProject._id,
      fullProject.resources.db.isExternal,
    );

    await createUniqueIndexes(Model, newCollectionConfig.model);

    // Clear redis cache
    await deleteProjectById(projectId.toString());
    await setProjectById(projectId.toString(), fullProject.toObject());
    await deleteProjectByApiKeyCache(fullProject.publishableKey);
    await deleteProjectByApiKeyCache(fullProject.secretKey);
    if (req.hashedApiKey) {
      await deleteProjectByApiKeyCache(req.hashedApiKey);
    }

    const projectObj = fullProject.toObject();
    delete projectObj.publishableKey;
    delete projectObj.secretKey;
    delete projectObj.jwtSecret;

    return new ApiResponse({ project: projectObj }, "Schema created successfully").send(res, 201);
  } catch (err) {
    try {
      if (fullProject && collectionWasPersisted) {
        fullProject.collections = fullProject.collections.filter(
          (c) => c.name !== collectionNameForRollback,
        );
        await fullProject.save();
      }

      if (connection && compiledCollectionName) {
        clearCompiledModel(connection, compiledCollectionName);

        if (!collectionExistedBefore) {
          await dropCollectionIfExists(connection, compiledCollectionName);
        }
      }
    } catch (rollbackErr) {
      console.error("Create schema rollback failed:", rollbackErr);
    }

    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.issues?.[0]?.message || "Invalid schema payload."));
    }

    if (err instanceof AppError) {
      return next(err);
    }

    console.error(err);
    return next(new AppError(500, "An error occurred while creating the schema."));
  }
};
