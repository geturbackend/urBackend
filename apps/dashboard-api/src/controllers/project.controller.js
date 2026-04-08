const mongoose = require("mongoose");
const { Project } = require("@urbackend/common");
const { Developer } = require("@urbackend/common");
const { Log } = require("@urbackend/common");
const { getStorage } = require("@urbackend/common");
const { randomUUID } = require("crypto");
const {
  createProjectSchema,
  createCollectionSchema,
  updateExternalConfigSchema,
  updateAuthProvidersSchema,
} = require("@urbackend/common");
const { generateApiKey, hashApiKey } = require("@urbackend/common");
const { z } = require("zod");
const { encrypt } = require("@urbackend/common");
const { URL } = require("url");
const { getConnection } = require("@urbackend/common");
const { getCompiledModel } = require("@urbackend/common");
const { QueryEngine } = require("@urbackend/common");
const { storageRegistry } = require("@urbackend/common");
const {
  deleteProjectByApiKeyCache,
  setProjectById,
  getProjectById,
  deleteProjectById,
} = require("@urbackend/common");
const { isProjectStorageExternal, getBucket } = require("@urbackend/common");
const { getPublicIp } = require("@urbackend/common");
const { clearCompiledModel } = require("@urbackend/common");
const { createUniqueIndexes } = require("@urbackend/common");

const validateUsersSchema = (schema) => {
  if (!Array.isArray(schema)) return false;

  const sanitizedSchema = sanitizeSchemaFields(schema);

  const hasEmail = sanitizedSchema.find(
    (f) =>
      normalizeFieldKey(f.key).toLowerCase() === "email" &&
      normalizeFieldType(f.type) === "string" &&
      isRequiredField(f.required),
  );

  const hasPassword = sanitizedSchema.find(
    (f) =>
      normalizeFieldKey(f.key).toLowerCase() === "password" &&
      normalizeFieldType(f.type) === "string" &&
      isRequiredField(f.required),
  );

  return !!(hasEmail && hasPassword);
};

const normalizeFieldKey = (key) =>
  String(key || "")
    .replace(/\uFEFF/g, "")
    .trim();

const normalizeFieldType = (type) =>
  String(type || "")
    .trim()
    .toLowerCase();

const isRequiredField = (required) =>
  required === true ||
  required === 1 ||
  String(required).trim().toLowerCase() === "true" ||
  String(required).trim() === "1";

const toPlainObject = (value) => {
  if (!value || typeof value !== "object") return value;
  if (typeof value.toObject === "function") {
    return value.toObject({ depopulate: true });
  }
  if (value._doc && typeof value._doc === "object") {
    return { ...value._doc };
  }
  return value;
};

const sanitizeSchemaFields = (schema = []) => {
  if (!Array.isArray(schema)) return [];
  return schema
    .map((rawField) => {
      const field = toPlainObject(rawField);
      if (!field || typeof field !== "object") return null;

      const normalizedKey = normalizeFieldKey(field.key);
      if (!normalizedKey) return null;

      const next = { ...field, key: normalizedKey };

      if (Array.isArray(field.fields)) {
        next.fields = sanitizeSchemaFields(field.fields);
      }

      if (field.items && typeof field.items === "object") {
        next.items = { ...field.items };
        if (Array.isArray(field.items.fields)) {
          next.items.fields = sanitizeSchemaFields(field.items.fields);
        }
      }

      return next;
    })
    .filter(Boolean);
};

const getDefaultRlsForCollection = (collectionName, schema = []) => {
  const normalizedName = String(collectionName || "").toLowerCase();
  const keys = sanitizeSchemaFields(schema).map((f) => f.key);

  let ownerField = "userId";
  if (normalizedName === "users") {
    ownerField = "_id";
  } else if (keys.includes("userId")) {
    ownerField = "userId";
  } else if (keys.includes("ownerId")) {
    ownerField = "ownerId";
  }

  return {
    enabled: false,
    mode: "public-read",
    ownerField,
    requireAuthForWrite: true,
  };
};

const SOCIAL_PROVIDER_KEYS = ["github", "google"];

/**
 * Sanitizes authProviders from a project document for safe API responses.
 * Strips clientSecret fields and replaces them with a boolean hasClientSecret flag.
 * @param {Object} authProviders - Raw authProviders from the project document
 * @returns {Object} Sanitized providers keyed by provider name
 */
const sanitizeAuthProviders = (authProviders = {}) => {
  return SOCIAL_PROVIDER_KEYS.reduce((acc, provider) => {
    const config = authProviders?.[provider] || {};
    const cs = config.clientSecret;
    const hasClientSecret =
      cs != null &&
      typeof cs === "object" &&
      Object.keys(cs).length > 0;
    acc[provider] = {
      enabled: !!config.enabled,
      clientId: config.clientId || "",
      hasClientSecret,
    };
    return acc;
  }, {});
};

const sanitizeProjectResponse = (projectObj) => {
  delete projectObj.publishableKey;
  delete projectObj.secretKey;
  delete projectObj.jwtSecret;
  const resendConfig = projectObj.resendApiKey;
  projectObj.hasResendApiKey =
    resendConfig != null &&
    typeof resendConfig === "object" &&
    Object.keys(resendConfig).length > 0;
  delete projectObj.resendApiKey;

  projectObj.authProviders = sanitizeAuthProviders(projectObj.authProviders);

  if (projectObj.collections && Array.isArray(projectObj.collections)) {
    projectObj.collections = projectObj.collections.map((col) => {
      if (col.name === "users" && col.model) {
        return {
          ...col,
          model: col.model.filter((m) => m.key !== "password"),
          rls: col.rls || getDefaultRlsForCollection(col.name, col.model),
        };
      }

      return {
        ...col,
        rls: col.rls || getDefaultRlsForCollection(col.name, col.model),
      };
    });
  }

  return projectObj;
};

module.exports.createProject = async (req, res) => {
  try {
    // POST FOR - PROJECT CREATION
    const { name, description, siteUrl } = createProjectSchema.parse(req.body);

    // --- PROJECT LIMIT CHECK ---
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    // GET MAX PROJECTS
    const dev = await Developer.findById(req.user._id);
    const MAX_PROJECTS = dev?.maxProjects || 1;

    const isUserAdmin = dev.email === ADMIN_EMAIL;
    const projectCount = await Project.countDocuments({ owner: req.user._id });

    if (!isUserAdmin && projectCount >= MAX_PROJECTS) {
      return res.status(403).json({
        error: `Project limit reached. Your current plan allows up to ${MAX_PROJECTS} projects.`,
        limit: MAX_PROJECTS,
        current: projectCount,
      });
    }
    // ---------------------------

    const rawPublishableKey = generateApiKey("pk_live_");
    const hashedPublishableKey = hashApiKey(rawPublishableKey);

    const rawSecretKey = generateApiKey("sk_live_");
    const hashedSecretKey = hashApiKey(rawSecretKey);

    const rawJwtSecret = generateApiKey("jwt_");

    const newProject = new Project({
      name,
      description,
      owner: req.user._id,
      publishableKey: hashedPublishableKey,
      secretKey: hashedSecretKey,
      jwtSecret: rawJwtSecret,
      siteUrl: siteUrl || "",
    });
    await newProject.save();

    const projectObj = newProject.toObject();
    projectObj.publishableKey = rawPublishableKey;
    projectObj.secretKey = rawSecretKey;
    delete projectObj.jwtSecret;
    projectObj.authProviders = sanitizeAuthProviders(projectObj.authProviders);

    res.status(201).json(projectObj);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports.getAllProject = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .select("name description")
      .lean();

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.getSingleProject = async (req, res) => {
  try {
    let projectObj = await getProjectById(req.params.projectId);

    if (!projectObj) {
      const project = await Project.findOne({
        _id: req.params.projectId,
        owner: req.user._id,
      }).select(
        "-publishableKey -secretKey -jwtSecret " +
          "+authProviders.github.clientSecret.encrypted " +
          "+authProviders.github.clientSecret.iv " +
          "+authProviders.github.clientSecret.tag " +
          "+authProviders.google.clientSecret.encrypted " +
          "+authProviders.google.clientSecret.iv " +
          "+authProviders.google.clientSecret.tag " +
          "+resendApiKey.encrypted " +
          "+resendApiKey.iv " +
          "+resendApiKey.tag",
      );
      if (!project)
        return res.status(404).json({ error: "Project not found." });
      projectObj = project.toObject();
      await setProjectById(req.params.projectId, projectObj);
    }

    // Ownership Check (Even for Cache)
    if (projectObj.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied." });
    }

    res.json(sanitizeProjectResponse(projectObj));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.regenerateApiKey = async (req, res) => {
  try {
    const { keyType } = req.body; // 'publishable' or 'secret'

    if (keyType !== "publishable" && keyType !== "secret") {
      return res
        .status(400)
        .json({ error: "Invalid keyType. Must be 'publishable' or 'secret'." });
    }

    const prefix = keyType === "publishable" ? "pk_live_" : "sk_live_";
    const newApiKey = generateApiKey(prefix);
    const hashed = hashApiKey(newApiKey);

    const oldApiProj = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user._id,
    }).select("publishableKey secretKey");
    if (!oldApiProj)
      return res.status(404).json({ error: "Project not found." });

    // CLEAR CACHE
    await deleteProjectByApiKeyCache(oldApiProj.publishableKey);
    await deleteProjectByApiKeyCache(oldApiProj.secretKey);

    const updateField =
      keyType === "publishable"
        ? { publishableKey: hashed }
        : { secretKey: hashed };

    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, owner: req.user._id },
      { $set: updateField },
      { new: true },
    );
    if (!project) return res.status(404).json({ error: "Project not found." });

    const projectObj = project.toObject();
    delete projectObj.publishableKey;
    delete projectObj.secretKey;
    delete projectObj.jwtSecret;
    res.json({ apiKey: newApiKey, keyType, project: projectObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
// VALIDATE URI
const isSafeUri = (uri) => {
  try {
    const parsed = new URL(uri);
    const host = parsed.hostname.toLowerCase();
    const badHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    return !badHosts.includes(host);
  } catch (e) {
    return false;
  }
};

module.exports.updateExternalConfig = async (req, res) => {
  try {
    const { projectId } = req.params;

    // POST FOR - EXTERNAL CONFIG
    const validatedData = updateExternalConfigSchema.parse(req.body);
    const { dbUri, storageUrl, storageKey, storageProvider } = validatedData;

    const updateData = {};

    // DB CONFIG
    if (dbUri) {
      if (!isSafeUri(dbUri))
        return res.status(400).json({
          error:
            "DB URI is pointing to a restricted host (localhost/internal).",
        });

      updateData["resources.db.config"] = encrypt(JSON.stringify({ dbUri }));
      updateData["resources.db.isExternal"] = true;

      // --- VERIFY CONNECTION ---
      console.log("Verifying connection to:", projectId);
      try {
        const tempConn = mongoose.createConnection(dbUri, {
          serverSelectionTimeoutMS: 5000,
        });
        await tempConn.asPromise();
        await tempConn.close();
      } catch (connErr) {
        console.error("Verification Connection Failed:", connErr.message);
        let errorMsg = "Could not connect to the provided MongoDB URI.";

        if (
          connErr.message.includes("Server selection timed out") ||
          connErr.message.includes("Could not connect")
        ) {
          const serverIp = await getPublicIp();
          errorMsg = `Access Denied: Please whitelist Server IP [${serverIp}] in MongoDB Atlas.`;
        } else {
          errorMsg += " " + connErr.message;
        }

        return res.status(400).json({ error: errorMsg });
      }
      // -------------------------
    }

    // STORAGE CONFIG
    if (storageUrl && storageKey) {
      const storageConfig = {
        storageUrl,
        storageKey,
        storageProvider: storageProvider || "supabase",
      };
      updateData["resources.storage.config"] = encrypt(
        JSON.stringify(storageConfig),
      );
      updateData["resources.storage.isExternal"] = true;
    }

    const project = await Project.findOneAndUpdate(
      { _id: projectId, owner: req.user._id },
      { $set: updateData },
      { new: true },
    );

    if (!project)
      return res
        .status(404)
        .json({ error: "Project not found or access denied." });

    res
      .status(200)
      .json({ message: "External configuration updated successfully." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }

    console.error("External Config Error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteExternalDbConfig = async (req, res) => {
  try {
    const parsedBody = z
      .object({
        projectId: z.string(),
      })
      .parse(req.body);
    const { projectId } = parsedBody;

    const project = await Project.findOne({
      _id: { $eq: projectId },
      owner: req.user._id,
    });
    if (!project)
      return res
        .status(404)
        .json({ error: "Project not found or access denied." });

    project.resources.db.isExternal = false;
    project.resources.db.config = null;
    await project.save();

    res
      .status(200)
      .json({ message: "External configuration deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteExternalStorageConfig = async (req, res) => {
  try {
    const parsedBody = z
      .object({
        projectId: z.string(),
      })
      .parse(req.body);
    const { projectId } = parsedBody;

    const project = await Project.findOne({
      _id: { $eq: projectId },
      owner: req.user._id,
    });
    if (!project)
      return res
        .status(404)
        .json({ error: "Project not found or access denied." });

    project.resources.storage.isExternal = false;
    project.resources.storage.config = null;

    await project.save();
    await deleteProjectById(projectId);
    await setProjectById(projectId, project.toObject());

    res
      .status(200)
      .json({ message: "External configuration deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST REQ FOR CREATE COLLECTION
module.exports.createCollection = async (req, res) => {
  let project;
  let connection;
  let compiledCollectionName;
  let collectionWasPersisted = false;
  let collectionNameForRollback;
  let collectionExistedBefore = false;

  try {
    const { projectId, collectionName, schema } = createCollectionSchema.parse(
      req.body,
    );

    collectionNameForRollback = collectionName;

    project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const exists = project.collections.find((c) => c.name === collectionName);
    if (exists)
      return res.status(400).json({ error: "Collection already exists" });

    if (!project.jwtSecret) {
      project.jwtSecret = generateApiKey("jwt_");
    }

    if (collectionName === "users") {
      if (!validateUsersSchema(schema)) {
        return res.status(422).json({
          error:
            "The 'users' collection must have required 'email' and 'password' string fields.",
        });
      }
    }

    compiledCollectionName = project.resources.db.isExternal
      ? collectionName
      : `${project._id}_${collectionName}`;

    const newCollectionConfig = {
      name: collectionName,
      model: schema,
      rls: getDefaultRlsForCollection(collectionName, schema),
    };

    project.collections.push(newCollectionConfig);
    await project.save();
    collectionWasPersisted = true;

    connection = await getConnection(projectId);

    collectionExistedBefore = await connection.db
      .listCollections({ name: compiledCollectionName }, { nameOnly: true })
      .hasNext();

    const Model = getCompiledModel(
      connection,
      newCollectionConfig,
      projectId,
      project.resources.db.isExternal,
    );

    await createUniqueIndexes(Model, newCollectionConfig.model);

    await deleteProjectById(projectId);
    await setProjectById(projectId, project.toObject());
    await deleteProjectByApiKeyCache(project.publishableKey);
    await deleteProjectByApiKeyCache(project.secretKey);

    const projectObj = project.toObject();
    delete projectObj.publishableKey;
    delete projectObj.secretKey;
    delete projectObj.jwtSecret;

    return res.status(201).json(projectObj);
  } catch (err) {
    try {
      if (project && collectionWasPersisted) {
        project.collections = project.collections.filter(
          (c) => c.name !== collectionNameForRollback,
        );
        await project.save();
      }

      if (connection && compiledCollectionName) {
        clearCompiledModel(connection, compiledCollectionName);

        if (!collectionExistedBefore) {
          await dropCollectionIfExists(connection, compiledCollectionName);
        }
      }
    } catch (rollbackErr) {
      console.error("Create collection rollback failed:", rollbackErr);
    }

    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }

    return res.status(400).json({ error: err.message });
  }
};

// GET DOC BY ID
module.exports.getData = async (req, res) => {
    try {
        const { projectId, collectionName } = req.params;
        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found." });

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) {
            return res.status(404).json({
                error: "Collection not found",
                collection: collectionName
            });
        }

        const connection = await getConnection(projectId);
        const model = getCompiledModel(connection, collectionConfig, projectId, project.resources.db.isExternal);

        // const collectionsList = await mongoose.connection.db.listCollections({ name: finalCollectionName }).toArray();

        const query = model.find();
        if (collectionName === 'users') {
            query.select('-password');
        }

        const features = new QueryEngine(query, req.query)
            .filter()
            .sort()
            .paginate();

        const data = await features.query.lean();

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.deleteCollection = async (req, res) => {
  try {
    const { projectId, collectionName } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    });
    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or access denied." });
    }

    const collectionIndex = project.collections.findIndex(
      (c) => c.name === collectionName,
    );
    if (collectionIndex === -1) {
      return res.status(404).json({ error: "Collection not found." });
    }

    const isExternal = project.resources?.db?.isExternal;
    const connection = await getConnection(projectId);

    const finalCollectionName = isExternal
      ? collectionName
      : `${project._id}_${collectionName}`;

    await dropCollectionIfExists(connection, finalCollectionName);
    clearCompiledModel(connection, finalCollectionName);

    project.collections.splice(collectionIndex, 1);
    await project.save();

    await deleteProjectById(projectId);
    await setProjectById(projectId, project.toObject());
    await deleteProjectByApiKeyCache(project.publishableKey);
    await deleteProjectByApiKeyCache(project.secretKey);

    return res.json({
      message: `Collection '${collectionName}' deleted successfully.`,
    });
  } catch (err) {
    console.error("Delete Collection Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.insertData = async (req, res) => {
  try {
    console.time("insert data");
    const { projectId, collectionName } = req.params;
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    });
    if (!project) return res.status(404).json({ error: "Project not found." });

    if (collectionName === "users") {
      return res.status(400).json({
        error:
          "Direct inserts into 'users' collection are not allowed. Please use the Auth signup or admin endpoints.",
      });
    }

    const incomingData = req.body;

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig) {
      return res
        .status(404)
        .json({ error: "Collection configuration not found." });
    }

    let docSize = 0;
    if (!project.resources.db.isExternal) {
      docSize = Buffer.byteLength(JSON.stringify(incomingData));

      const limit = project.databaseLimit || 20 * 1024 * 1024;

      if ((project.databaseUsed || 0) + docSize > limit) {
        return res
          .status(403)
          .json({ error: "Database limit exceeded. Delete some data." });
      }
    }

    const connection = await getConnection(projectId);
    const model = getCompiledModel(
      connection,
      collectionConfig,
      projectId,
      project.resources.db.isExternal,
    );

    const result = await model.create(incomingData);

    if (!project.resources.db.isExternal) {
      project.databaseUsed = (project.databaseUsed || 0) + docSize;
    }
    await project.save();

    res.json(result);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate value violates unique constraint.",
        details: err.message,
      });
    }

    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteRow = async (req, res) => {
  try {
    const { projectId, collectionName, id } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    });
    if (!project) return res.status(404).json({ error: "Project not found." });

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig) {
      return res.status(404).json({ error: "Collection not found." });
    }

    const connection = await getConnection(projectId);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      projectId,
      project.resources.db.isExternal,
    );

    const docToDelete = await Model.findById(id);
    if (!docToDelete) {
      return res.status(404).json({ error: "Document not found." });
    }

    const docSize = Buffer.byteLength(JSON.stringify(docToDelete));

    await Model.deleteOne({ _id: id });

    if (!project.resources.db.isExternal) {
      project.databaseUsed = Math.max(0, (project.databaseUsed || 0) - docSize);
      await project.save();
    }

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.editRow = async (req, res) => {
  try {
    const { projectId, collectionName, id } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    });
    if (!project) return res.status(404).json({ error: "Project not found." });

    const collectionConfig = project.collections.find(
      (c) => c.name === collectionName,
    );
    if (!collectionConfig) {
      return res.status(404).json({ error: "Collection not found." });
    }

    const connection = await getConnection(projectId);
    const Model = getCompiledModel(
      connection,
      collectionConfig,
      projectId,
      project.resources.db.isExternal,
    );

    if (collectionName === "users") {
      delete req.body.password;
      // Also ensure it's not and nested or sneaky
      Object.keys(req.body).forEach((key) => {
        if (key.toLowerCase().includes("password")) delete req.body[key];
      });
    }

    const docToEdit = await Model.findById(id);
    if (!docToEdit) {
      return res.status(404).json({ error: "Document not found." });
    }

    const oldSize = Buffer.byteLength(JSON.stringify(docToEdit.toObject()));

    docToEdit.set(req.body);

    const newSize = Buffer.byteLength(JSON.stringify(docToEdit.toObject()));
    const sizeDiff = newSize - oldSize;

    if (!project.resources.db.isExternal) {
      const limit = project.databaseLimit || 500 * 1024 * 1024;
      const currentUsed = project.databaseUsed || 0;

      if (currentUsed + sizeDiff > limit) {
        return res.status(403).json({ error: "Database limit exceeded." });
      }
    }

    const updatedDoc = await docToEdit.save();

    if (!project.resources.db.isExternal) {
      const currentUsed = project.databaseUsed || 0;
      project.databaseUsed = Math.max(0, currentUsed + sizeDiff);
      await project.save();
    }

    const responseData = updatedDoc.toObject();
    if (collectionName === "users") {
      delete responseData.password;
    }

    res.json({
      success: true,
      message: "Document edited successfully",
      data: responseData,
    });
  } catch (err) {
    console.error("Edit Error:", err);

    if (err && err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate value violates unique constraint.",
        details: err.message,
      });
    }

    res.status(500).json({ error: err.message });
  }
};

module.exports.listFiles = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    }).select(
      "+resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag resources.storage.isExternal storageUsed storageLimit",
    );
    if (!project) return res.status(404).json({ error: "Project not found" });

    const supabase = await getStorage(project);
    const bucket = getBucket(project);

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(`${projectId}`, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) throw error;

    const files = data.map((file) => {
      const { data: url } = supabase.storage
        .from(bucket)
        .getPublicUrl(`${projectId}/${file.name}`);

      return {
        ...file,
        path: `${projectId}/${file.name}`,
        publicUrl: url.publicUrl,
      };
    });

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Something Went Wrong",
      try: "Try checking docs or contact support - urbackend@bitbros.in",
    });
  }
};

module.exports.uploadFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    }).select(
      "+resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag resources.storage.isExternal storageUsed storageLimit",
    );
    if (!project) return res.status(404).json({ error: "Project not found" });

    const external = isProjectStorageExternal(project);

    if (!external) {
      if (project.storageUsed + file.size > project.storageLimit) {
        return res.status(403).json({ error: "Storage limit exceeded" });
      }
    }

    const supabase = await getStorage(project);
    const bucket = getBucket(project);

    const safeName = file.originalname.replace(/\s+/g, "_");
    const path = `${projectId}/${randomUUID()}_${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    if (!external) {
      project.storageUsed += file.size;
      await project.save();
    }

    res.json({ success: true, path });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports.deleteFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path } = req.body;

    if (!path) return res.status(400).json({ error: "Path required" });

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    }).select(
      "+resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag resources.storage.isExternal storageUsed storageLimit",
    );
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (!path.startsWith(`${projectId}/`)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const supabase = await getStorage(project);
    const bucket = getBucket(project);
    const external = isProjectStorageExternal(project);

    let fileSize = 0;

    if (!external) {
      const { data } = await supabase.storage.from(bucket).list(projectId, {
        search: path.split("/").pop(),
      });

      if (data?.length) {
        fileSize = data[0]?.metadata?.size || 0;
      }
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;

    if (!external && fileSize > 0) {
      project.storageUsed = Math.max(0, project.storageUsed - fileSize);
      await project.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteAllFiles = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    }).select(
      "+resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag resources.storage.isExternal storageUsed storageLimit",
    );
    if (!project) return res.status(404).json({ error: "Project not found" });

    const supabase = await getStorage(project);
    const bucket = getBucket(project);

    let hasMore = true;
    let deleted = 0;

    while (hasMore) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(projectId, { limit: 100 });

      if (error) throw error;

      if (data.length === 0) {
        hasMore = false;
      } else {
        const paths = data.map((f) => `${projectId}/${f.name}`);
        await supabase.storage.from(bucket).remove(paths);
        deleted += data.length;
      }
    }

    if (!isProjectStorageExternal(project)) {
      project.storageUsed = 0;
      await project.save();
    }

    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.updateProject = async (req, res) => {
  try {
    const { name, siteUrl, resendApiKey, resendFromEmail } = req.body;
    const updateFields = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "name must be a non-empty string." });
      }
      updateFields.name = name.trim();
    }
    if (resendFromEmail !== undefined) {
      if (typeof resendFromEmail !== "string") {
        return res.status(400).json({ error: "resendFromEmail must be a string." });
      }
      const trimmedFrom = resendFromEmail.trim();
      if (trimmedFrom !== "") {
         if (trimmedFrom.length > 255) {
            return res.status(400).json({ error: "resendFromEmail is too long." });
         }
         let addressToValidate = trimmedFrom;
         const bracketMatch = trimmedFrom.match(/<([^>]+)>$/);
         if (bracketMatch) {
            addressToValidate = bracketMatch[1].trim();
         }
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(addressToValidate)) {
            return res.status(400).json({ error: "resendFromEmail must be a valid format (e.g., 'me@domain.com' or 'App <me@domain.com>')." });
         }
      }
      updateFields.resendFromEmail = trimmedFrom;
    }
    if (siteUrl !== undefined) {
      if (siteUrl !== "" && typeof siteUrl !== "string") {
        return res.status(400).json({ error: "siteUrl must be a string." });
      }
      if (siteUrl) {
        try {
          const parsed = new URL(siteUrl);
          if (
            parsed.protocol !== "https:" &&
            !(
              parsed.protocol === "http:" &&
              parsed.hostname === "localhost"
            )
          ) {
            return res.status(400).json({
              error:
                "Site URL must use HTTPS (or http://localhost for local development).",
            });
          }
        } catch {
          return res.status(400).json({ error: "Invalid Site URL format." });
        }
      }
      updateFields.siteUrl = siteUrl || "";
    }
    if (resendApiKey !== undefined) {
      if (typeof resendApiKey !== "string" || !resendApiKey.trim()) {
        return res
          .status(400)
          .json({ error: "resendApiKey must be a non-empty string." });
      }
      updateFields.resendApiKey = encrypt(resendApiKey.trim());
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, owner: req.user._id },
      { $set: updateFields },
      {
        new: true,
        projection:
          "+resendApiKey.encrypted +resendApiKey.iv +resendApiKey.tag",
      },
    );
    if (!project) return res.status(404).json({ error: "Project not found." });

    await deleteProjectById(project._id.toString());
    await deleteProjectByApiKeyCache(project.publishableKey);
    await deleteProjectByApiKeyCache(project.secretKey);

    res.json(sanitizeProjectResponse(project.toObject()));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.updateAllowedDomains = async (req, res) => {
  try {
    const { domains } = req.body;
    if (
      !Array.isArray(domains) ||
      !domains.every((d) => typeof d === "string")
    ) {
      return res
        .status(400)
        .json({ error: "domains must be an array of strings." });
    }

    const cleanedDomains = domains
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, owner: req.user._id },
      { $set: { allowedDomains: cleanedDomains } },
      { new: true },
    );

    if (!project)
      return res
        .status(404)
        .json({ error: "Project not found or access denied." });
    await deleteProjectById(project._id.toString());
    await setProjectById(project._id.toString(), project.toObject());
    await deleteProjectByApiKeyCache(project.publishableKey);
    await deleteProjectByApiKeyCache(project.secretKey);

    res.json({
      message: "Allowed domains updated",
      allowedDomains: project.allowedDomains,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    }).select(
      "+resources.storage.config.encrypted " +
        "+resources.storage.config.iv " +
        "+resources.storage.config.tag",
    );

    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or access denied." });
    }

    // DROP COLLECTIONS: Only for internal databases
    if (!project.resources.db.isExternal) {
      for (const col of project.collections) {
        const collectionName = `${project._id}_${col.name}`;
        try {
          await mongoose.connection.db.dropCollection(collectionName);
        } catch (e) {}
      }

      try {
        await mongoose.connection.db.dropCollection(`${project._id}_users`);
      } catch (e) {}
    }

    // DELETE: Only for internal Infraa
    if (!isProjectStorageExternal(project)) {
      const supabase = await getStorage(project);
      const bucket = getBucket(project);

      let hasMoreFiles = true;

      while (hasMoreFiles) {
        const { data: files, error } = await supabase.storage
          .from(bucket)
          .list(projectId, { limit: 100 });

        if (error) throw error;

        if (files && files.length > 0) {
          const paths = files.map((f) => `${projectId}/${f.name}`);
          await supabase.storage.from(bucket).remove(paths);
        } else {
          hasMoreFiles = false;
        }
      }
    }

    await Project.deleteOne({ _id: projectId });
    storageRegistry.delete(projectId.toString());

    res.json({
      message: "Project and all associated resources deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.analytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    });
    if (!project)
      return res
        .status(404)
        .json({ error: "Project not found or access denied." });
    const totalRequests = await Log.countDocuments({ projectId });
    const logs = await Log.find({ projectId })
      .sort({ timestamp: -1 })
      .limit(50);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartData = await Log.aggregate([
      {
        $match: {
          projectId: new mongoose.Types.ObjectId(projectId),
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      storage: { used: project.storageUsed, limit: project.storageLimit },
      database: { used: project.databaseUsed, limit: project.databaseLimit },
      totalRequests,
      logs,
      chartData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// FUNCTION - TOGGLE AUTH
module.exports.toggleAuth = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { enable } = req.body; // true or false

    // Ensure user owns project, and load authProviders secrets so sanitizeAuthProviders
    // can correctly compute hasClientSecret in the response.
    // NOTE: If new OAuth providers are added to SOCIAL_PROVIDER_KEYS, extend this select list
    // to include their clientSecret fields as well.
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    }).select(
      "+authProviders.github.clientSecret.encrypted " +
      "+authProviders.github.clientSecret.iv " +
      "+authProviders.github.clientSecret.tag " +
      "+authProviders.google.clientSecret.encrypted " +
      "+authProviders.google.clientSecret.iv " +
      "+authProviders.google.clientSecret.tag"
    );
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (enable) {
      const usersCol = project.collections.find((c) => c.name === "users");
      if (!usersCol) {
        return res.status(422).json({
          error: "Users Collection Missing",
          message:
            "The 'users' collection must be created and configured with required 'email' and 'password' fields before enabling Authentication.",
        });
      }

      if (!validateUsersSchema(usersCol.model)) {
        return res.status(422).json({
          error: "Invalid Users Schema",
          message:
            "The 'users' collection must have required 'email' and 'password' string fields. Please fix the schema before enabling Auth.",
        });
      }
    }

    project.isAuthEnabled = !!enable;
    await project.save();

    await deleteProjectById(projectId);
    await deleteProjectByApiKeyCache(project.publishableKey);
    await deleteProjectByApiKeyCache(project.secretKey);

    const projectObj = sanitizeProjectResponse(project.toObject());

    res.json({
      message: `Authentication ${project.isAuthEnabled ? "enabled" : "disabled"} successfully`,
      isAuthEnabled: project.isAuthEnabled,
      project: projectObj,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates GitHub/Google OAuth provider settings for a project.
 * Preserves existing encrypted client secrets when not provided in the update.
 * @route PUT /api/projects/:projectId/auth-providers
 */
module.exports.updateAuthProviders = async (req, res) => {
  try {
    const { projectId } = req.params;
    const parsed = updateAuthProvidersSchema.parse(req.body || {});

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id,
    }).select(
      "+authProviders.github.clientSecret.encrypted " +
        "+authProviders.github.clientSecret.iv " +
        "+authProviders.github.clientSecret.tag " +
        "+authProviders.google.clientSecret.encrypted " +
        "+authProviders.google.clientSecret.iv " +
        "+authProviders.google.clientSecret.tag",
    );

    if (!project) return res.status(404).json({ error: "Project not found" });

    project.authProviders = project.authProviders || {};

    for (const provider of SOCIAL_PROVIDER_KEYS) {
      const incoming = parsed[provider];
      if (!incoming) continue;

      const current = project.authProviders?.[provider] || {};
      const nextEnabled =
        typeof incoming.enabled === "boolean" ? incoming.enabled : !!current.enabled;
      const nextClientId =
        incoming.clientId !== undefined ? incoming.clientId : (current.clientId || "");
      const nextClientSecret =
        incoming.clientSecret !== undefined
          ? encrypt(incoming.clientSecret)
          : (current.clientSecret || null);

      if (nextEnabled && (!nextClientId || !nextClientSecret)) {
        return res.status(422).json({
          error: "Incomplete provider config",
          message: `${provider} requires clientId and clientSecret before it can be enabled.`,
        });
      }

      // P1: Require siteUrl before enabling any OAuth provider
      if (nextEnabled && !project.siteUrl?.trim()) {
        return res.status(422).json({
          error: "siteUrl required",
          message: `You must configure a Site URL in Project Settings before enabling ${provider} OAuth. The Site URL is used to redirect users after authentication.`,
        });
      }

      project.authProviders[provider] = {
        enabled: nextEnabled,
        clientId: nextClientId,
        clientSecret: nextClientSecret,
        redirectUri: current.redirectUri || "",
      };
    }

    await project.save();

    await deleteProjectById(projectId);
    await deleteProjectByApiKeyCache(project.publishableKey);
    await deleteProjectByApiKeyCache(project.secretKey);

    return res.json({
      message: "Auth providers updated",
      authProviders: sanitizeAuthProviders(project.toObject().authProviders),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    return res.status(500).json({ error: err.message });
  }
};


// PATCH FOR UPDATING COLLECTION RLS
module.exports.updateCollectionRls = async (req, res) => {
    try {
        const { projectId, collectionName } = req.params;
        const { enabled, mode, ownerField, requireAuthForWrite } = req.body || {};

        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found" });

        const collection = project.collections.find(c => c.name === collectionName);
        if (!collection) return res.status(404).json({ error: "Collection not found" });

        const validMode = mode || collection?.rls?.mode || 'public-read';
        const allowedModes = new Set(['public-read', 'private', 'owner-write-only']);
        if (!allowedModes.has(validMode)) {
            return res.status(400).json({ error: "Unsupported RLS mode. Allowed: public-read, private, owner-write-only (legacy)." });
        }

        const modelKeys = (collection.model || [])
            .map(f => String(f?.key || '').trim())
            .filter(Boolean);
        const modelKeySet = new Set(modelKeys);
        const modelKeyLowerMap = new Map(modelKeys.map(k => [k.toLowerCase(), k]));

        const requestedOwnerRaw = String(ownerField ?? collection?.rls?.ownerField ?? 'userId').trim();
        const requestedOwnerLower = requestedOwnerRaw.toLowerCase();
        const canonicalOwnerField = modelKeySet.has(requestedOwnerRaw)
            ? requestedOwnerRaw
            : modelKeyLowerMap.get(requestedOwnerLower);
        const nextOwnerField = requestedOwnerRaw === '_id' ? '_id' : (canonicalOwnerField || requestedOwnerRaw);

        if (nextOwnerField !== '_id' && !modelKeySet.has(nextOwnerField)) {
            return res.status(400).json({
                error: "Invalid owner field",
                message: `ownerField '${nextOwnerField}' not found in collection schema`
            });
        }

        // Restrict use of '_id' as ownerField to the 'users' collection only.
        if (nextOwnerField === '_id' && collection.name !== 'users') {
            return res.status(400).json({
                error: "Invalid owner field",
                message: "ownerField '_id' is only allowed for the 'users' collection"
            });
        }

        collection.rls = {
            enabled: typeof enabled === 'boolean' ? enabled : !!collection?.rls?.enabled,
            mode: validMode,
            ownerField: nextOwnerField,
            requireAuthForWrite: typeof requireAuthForWrite === 'boolean'
                ? requireAuthForWrite
                : (collection?.rls?.requireAuthForWrite ?? true)
        };

        await project.save();

        await deleteProjectById(projectId);
        await deleteProjectByApiKeyCache(project.publishableKey);
        await deleteProjectByApiKeyCache(project.secretKey);

        res.json({
            message: "Collection RLS updated",
            collection: {
                name: collection.name,
                rls: collection.rls
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
