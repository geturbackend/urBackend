const modelRegistry = new WeakMap();
const mongoose = require("mongoose");
const { UNIQUE_SUPPORTED_TYPES_SET } = require("./schema.constants");

const typeMapping = {
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
};

// Recursive field definition builder
// Recursive field definition builder
function buildFieldDef(field, projectId, isExternal, isUsersCollection = false) {
  // Object type — nested sub-schema
  if (field.type === "Object" && field.fields && field.fields.length > 0) {
    const subSchema = {};
    field.fields.forEach((f) => {
      const normalizedKey = normalizeKey(f.key);
      if (!normalizedKey) return;

      subSchema[normalizedKey] = buildFieldDef(f, projectId, isExternal, isUsersCollection);
    });
    return { type: subSchema, required: !!field.required };
  }

  // Array type
  if (field.type === "Array") {
    if (!field.items) {
      return {
        type: [mongoose.Schema.Types.Mixed],
        required: !!field.required,
      };
    }
    // Array of Objects
    if (
      field.items.type === "Object" &&
      field.items.fields &&
      field.items.fields.length > 0
    ) {
      const subSchema = {};
      field.items.fields.forEach((f) => {
        const normalizedKey = normalizeKey(f.key);
        if (!normalizedKey) return;

        subSchema[normalizedKey] = buildFieldDef(f, projectId, isExternal, isUsersCollection);
      });
      return { type: [subSchema], required: !!field.required };
    }
    // Array of Ref
    if (field.items && field.items.type === "Ref") {
      const targetRef = isExternal ? field.items.ref : `${projectId}_${field.items.ref}`;
      return {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: targetRef }],
        required: !!field.required,
      };
    }
    // Array of primitives
    const itemType =
      typeMapping[field.items.type] || mongoose.Schema.Types.Mixed;
    return { type: [itemType], required: !!field.required };
  }

  // Ref type — stores ObjectId
  if (field.type === "Ref") {
    const targetRef = isExternal ? field.ref : `${projectId}_${field.ref}`;
    return {
      type: mongoose.Schema.Types.ObjectId,
      ref: targetRef,
      required: !!field.required,
    };
  }

  // Primitive types
  const def = {
    type: typeMapping[field.type],
    required: !!field.required,
  };

  // pass default through when defined
  if (field.default !== undefined) {
    def.default = field.default;
  }

  // HARDEN: Exclude password by default for project users
  if (isUsersCollection && normalizeKey(field.key) === "password") {
    def.select = false;
  }

  return def;
}
function normalizeKey(key) {
  return String(key || "")
    .replace(/\uFEFF/g, "")
    .trim();
}

function buildMongooseSchema(fieldsArray = [], projectId, isExternal, isUsersCollection = false) {
  const schemaDef = {};

  fieldsArray.forEach((field) => {
    const normalizedKey = normalizeKey(field.key);
    if (!normalizedKey) return;

    schemaDef[normalizedKey] = buildFieldDef(field, projectId, isExternal, isUsersCollection);
  });

  return new mongoose.Schema(schemaDef, {
    timestamps: true,
    strict: false,
  });
}
function getCompiledModel(connection, collectionData, projectId, isExternal) {
  let collectionName = "";

  if (!isExternal) {
    collectionName = `${projectId}_${collectionData.name}`;
  } else {
    collectionName = collectionData.name;
  }

  // Get per-connection cache
  if (!modelRegistry.has(connection)) {
    modelRegistry.set(connection, new Map());
  }

  const connectionModels = modelRegistry.get(connection);

  // If already compiled for THIS connection
  if (connectionModels.has(collectionName)) {
    return connectionModels.get(collectionName);
  }

  // If model already exists on connection (edge case)
  if (connection.models[collectionName]) {
    const existingModel = connection.models[collectionName];
    connectionModels.set(collectionName, existingModel);
    return existingModel;
  }

  // Build schema + compile
  const isUsersCollection = collectionData.name === "users";
  const schema = buildMongooseSchema(collectionData.model, projectId, isExternal, isUsersCollection);
  const model = connection.model(collectionName, schema);

  // Cache it
  connectionModels.set(collectionName, model);

  return model;
}


// Clear cached model (needed when schema changes)
function clearCompiledModel(connection, collectionName) {
  if (modelRegistry.has(connection)) {
    modelRegistry.get(connection).delete(collectionName);
  }
  if (connection.models[collectionName]) {
    delete connection.models[collectionName];
  }
}

function getUniqueFieldFilter(fieldKey, isRequired) {
  if (isRequired) {
    return {}; // scan ALL docs, including those missing the field
  }

  return { [fieldKey]: { $exists: true, $ne: null } };
}

async function findDuplicates(Model, fieldKey, isRequired) {
  return Model.aggregate([
    {
      $match: getUniqueFieldFilter(fieldKey, isRequired),
    },
    {
      $group: {
        _id: `$${fieldKey}`,
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);
}

async function createUniqueIndexes(Model, fields = []) {
  const createdIndexes = [];

  let existingIndexes = [];
  try {
    existingIndexes = await Model.collection.indexes();
  } catch (err) {
    if (err.code !== 26 && !/ns does not exist/i.test(err.message)) {
      throw err;
    }
  }
  const existingIndexNames = new Set(existingIndexes.map((idx) => idx.name));

  try {
    for (const field of fields) {
      if (!field.unique) continue;
      if (!UNIQUE_SUPPORTED_TYPES_SET.has(field.type)) continue;

      const normalizedKey = normalizeKey(field.key);
      if (!normalizedKey) continue;

      const duplicates = await findDuplicates(
        Model,
        normalizedKey,
        !!field.required,
      );

      if (duplicates.length > 0) {
        const examples = duplicates
          .slice(0, 3)
          .map((d) => JSON.stringify(d._id))
          .join(", ");

        throw new Error(
          `Cannot create unique index on '${normalizedKey}'. ${duplicates.length} duplicate values exist.${examples ? ` Examples: ${examples}` : ""}`,
        );
      }

      const indexName = `unique_${normalizedKey}_1`;

      const indexOptions = {
        unique: true,
        name: indexName,
      };

      if (!field.required) {
        indexOptions.partialFilterExpression = {
          [normalizedKey]: { $exists: true, $ne: null },
        };
      }

      const createdName = await Model.collection.createIndex(
        { [normalizedKey]: 1 },
        indexOptions,
      );
      if (!existingIndexNames.has(createdName)) {
        createdIndexes.push(createdName);
      }
    }
  } catch (err) {
    for (const indexName of createdIndexes) {
      await Model.collection.dropIndex(indexName).catch(() => {});
    }
    throw err;
  }
}

module.exports = {
  getCompiledModel,
  clearCompiledModel,
  createUniqueIndexes,
};
