const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/urbackend-testV18';

async function run() {
  await mongoose.connect(MONGO_URL);
  const Project = require('../../packages/common/src/models/Project.js');

  const project = await Project.findOne({});
  if (project && project.collections.length > 0) {
    const col = project.collections[project.collections.length - 1];
    console.log("Last collection:", col.name);
    console.log("Model:", JSON.stringify(col.model, null, 2));
  } else {
    console.log("No projects");
  }
  process.exit(0);
}
run();
