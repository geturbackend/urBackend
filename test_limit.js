const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_limit');
  
  const schemaDef = { name: String, isDeleted: { type: Boolean, default: false } };
  const schema = new mongoose.Schema(schemaDef, { timestamps: true, strict: false });
  const Model = mongoose.model('TestDocLimit', schema);

  await Model.deleteMany({});
  
  const docs = [];
  for (let i = 0; i < 200; i++) {
    docs.push({ name: 'doc' + i, isDeleted: false });
  }
  await Model.insertMany(docs);

  const QueryEngine = require('./packages/common/src/utils/queryEngine.js');
  const reqQuery = { limit: '150' }; // simulated limit
  const baseFilter = {};
  
  const features = new QueryEngine(Model.find(), reqQuery).filter();
  
  features.sort().limitFields();
  features.paginate();
  
  const fetched = await features.query.lean();
  console.log("Fetched docs count:", fetched.length);
  
  process.exit(0);
}
test().catch(console.error);
