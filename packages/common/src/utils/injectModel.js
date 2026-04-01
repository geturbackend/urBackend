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
function buildFieldDef(field) {
  // Object type — nested sub-schema
  if (field.type === "Object" && field.fields && field.fields.length > 0) {
    const subSchema = {};
    field.fields.forEach((f) => {
      subSchema[f.key] = buildFieldDef(f);
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
        subSchema[f.key] = buildFieldDef(f);
      });
      return { type: [subSchema], required: !!field.required };
    }
    // Array of Ref
    if (field.items.type === "Ref") {
      return {
        type: [{ type: mongoose.Schema.Types.ObjectId }],
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
    return {
      type: mongoose.Schema.Types.ObjectId,
      required: !!field.required,
    };
  }

  // Primitive types
  return {
    type: typeMapping[field.type],
    required: !!field.required,
  };
}
function normalizeKey(key) {
  return String(key || "")
    .replace(/\uFEFF/g, "")
    .trim();
}

function buildMongooseSchema(fieldsArray = []) {
  const schemaDef = {};

  fieldsArray.forEach((field) => {
    const normalizedKey = normalizeKey(field.key);
    if (!normalizedKey) return;

    schemaDef[normalizedKey] = buildFieldDef(field);
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
  const schema = buildMongooseSchema(collectionData.model);
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
    return { [fieldKey]: { $exists: true } };
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

    await Model.collection.createIndex({ [normalizedKey]: 1 }, indexOptions);
  }
}

module.exports = {
  getCompiledModel,
  clearCompiledModel,
  createUniqueIndexes,
};
