const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_isdeleted3');
  
  const schemaDef = { name: String, isDeleted: { type: Boolean, default: false } };
  const schema = new mongoose.Schema(schemaDef, { timestamps: true, strict: false });
  const Model = mongoose.model('TestDoc3', schema);

  await Model.deleteMany({});
  
  await Model.create({ name: 'doc1', isDeleted: false });
  await Model.create({ name: 'doc2', isDeleted: true });

  const QueryEngine = require('./packages/common/src/utils/queryEngine.js');
  const reqQuery = {};
  const baseFilter = { name: { $exists: true } };
  
  const features = new QueryEngine(Model.find(), reqQuery).filter();
  if (Object.keys(baseFilter).length > 0) {
      features.query = features.query.and([baseFilter]);
  }
  
  features.sort().limitFields();
  features.paginate();
  
  const docs = await features.query.lean();
  console.log("Returned docs:", docs);
  console.log("Query was:", JSON.stringify(features.query.getQuery()));
}

test()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
