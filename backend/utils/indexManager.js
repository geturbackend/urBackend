async function findDuplicates(Model, fieldName) {
  return Model.aggregate([
    {
      $match: {
        [fieldName]: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: `$${fieldName}`,
        count: { $sum: 1 },
      },
    },
    {
      $match: { count: { $gt: 1 } },
    },
  ]);
}

async function createUniqueIndexes(Model, fields = []) {
  const supportedTypes = new Set(["String", "Number", "Boolean", "Date"]);

  for (const field of fields) {
    if (!field.unique) continue;
    if (!supportedTypes.has(field.type)) continue;

    // Check for duplicate values before creating the index
    const duplicates = await findDuplicates(Model, field.key);

    if (duplicates.length > 0) {
      throw new Error(
        `Cannot add unique constraint: ${duplicates.length} duplicate values found for field '${field.key}'`,
      );
    }

    // Create MongoDB unique index
    await Model.collection.createIndex(
      { [field.key]: 1 },
      {
        unique: true,
        sparse: !field.required,
        name: `${field.key}_1`,
      },
    );
  }
}

module.exports = { createUniqueIndexes };
