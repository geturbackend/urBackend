const mongoose = require('mongoose');
const { Schema } = mongoose;

const TestSchema = new Schema({
  name: String,
  isDeleted: Boolean
});

const TestModel = mongoose.model('Test', TestSchema);

let q = TestModel.find();
q = q.find({ isDeleted: { $ne: true } });
q = q.and([{ name: 'foo' }]);

console.log(JSON.stringify(q.getQuery(), null, 2));
