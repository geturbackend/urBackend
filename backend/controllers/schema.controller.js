const { createSchemaApiKeySchema } = require("../utils/input.validation");
const Project = require("../models/Project");
const { v4: uuidv4 } = require("uuid");
const {
  deleteProjectById,
  setProjectById,
  deleteProjectByApiKeyCache,
} = require("../services/redisCaching");
const { z } = require("zod");
const { getConnection } = require("../utils/connection.manager");
const {
  getCompiledModel,
  clearCompiledModel,
} = require("../utils/injectModel");
const { createUniqueIndexes } = require("../utils/indexManager");

module.exports.checkSchema = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const project = req.project;

    if (!project)
      return res.status(401).json({ error: "Project missing from request." });

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );

    if (!collectionConfig) {
      return res.status(404).json({ error: "Schema/Collection not found" });
    }

    res
      .status(200)
      .json({ message: "Schema exists", collection: collectionConfig });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.createSchema = async (req, res) => {
  try {
    const { name, fields } = createSchemaApiKeySchema.parse(req.body);
    const project = req.project;

    const projectId = project._id;
    const fullProject = await Project.findById(projectId);

    if (!fullProject)
      return res.status(404).json({ error: "Project not found" });

    const exists = fullProject.collections.find((c) => c.name === name);
    if (exists)
      return res
        .status(400)
        .json({ error: "Collection/Schema already exists" });

    if (!fullProject.jwtSecret) fullProject.jwtSecret = uuidv4();

    // Recursive field transformer (API uses 'name', internal uses 'key')
    function transformField(f) {
      const mappedType =
        f.type.charAt(0).toUpperCase() + f.type.slice(1).toLowerCase();
      const mapped = {
        key: f.name,
        type: mappedType,
        required: f.required === true,
        unique: f.unique === true,
      };
      if (f.ref) mapped.ref = f.ref;
      if (f.items) {
        mapped.items = {
          type:
            f.items.type.charAt(0).toUpperCase() +
            f.items.type.slice(1).toLowerCase(),
        };
        if (f.items.fields) {
          mapped.items.fields = f.items.fields.map((sf) => transformField(sf));
        }
      }
      if (f.fields) {
        mapped.fields = f.fields.map((sf) => transformField(sf));
      }
      return mapped;
    }

    const transformedFields = (fields || []).map((f) => transformField(f));

    fullProject.collections.push({ name: name, model: transformedFields });
    await fullProject.save();

    try {
      const collectionConfig = fullProject.collections.find(
        (c) => c.name === name,
      );

      const connection = await getConnection(fullProject._id);
      const Model = getCompiledModel(
        connection,
        collectionConfig,
        fullProject._id,
        fullProject.resources.db.isExternal,
      );

      await createUniqueIndexes(Model, collectionConfig.model);
    } catch (error) {
      const compiledCollectionName = fullProject.resources.db.isExternal
        ? name
        : `${fullProject._id}_${name}`;

      const connection = await getConnection(fullProject._id);
      clearCompiledModel(connection, compiledCollectionName);

      fullProject.collections = fullProject.collections.filter(
        (c) => c.name !== name,
      );
      await fullProject.save();

      return res.status(400).json({ error: error.message });
    }

    // Clear redis cache
    await deleteProjectById(projectId.toString());
    await setProjectById(projectId.toString(), fullProject);
    await deleteProjectByApiKeyCache(fullProject.publishableKey);
    await deleteProjectByApiKeyCache(fullProject.secretKey);
    if (req.hashedApiKey) {
      await deleteProjectByApiKeyCache(req.hashedApiKey);
    }

    const projectObj = fullProject.toObject();
    delete projectObj.publishableKey;
    delete projectObj.secretKey;
    delete projectObj.jwtSecret;

    res
      .status(201)
      .json({ message: "Schema created successfully", project: projectObj });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ error: err.errors });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
