const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_isdeleted');
  
  const schemaDef = { name: String, isDeleted: { type: Boolean, default: false } };
  const schema = new mongoose.Schema(schemaDef, { timestamps: true, strict: false });
  const Model = mongoose.model('TestDoc', schema);

  await Model.deleteMany({});
  
  await Model.create({ name: 'doc1', isDeleted: false });
  await Model.create({ name: 'doc2', isDeleted: true });
  // string "true"
  await Model.collection.insertOne({ name: 'doc3', isDeleted: "true" });
  await Model.collection.insertOne({ name: 'doc4', isDeleted: true });

  const QueryEngine = require('./packages/common/src/utils/queryEngine.js');
  const features = new QueryEngine(Model.find(), {}).filter();
  
  const docs = await features.query.lean();
  console.log("Returned docs:", docs.map(d => ({ name: d.name, isDeleted: d.isDeleted })));
}

test()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
