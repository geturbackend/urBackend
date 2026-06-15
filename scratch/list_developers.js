const mongoose = require('mongoose');
const { connectDB, Developer } = require('@urbackend/common');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function list() {
    await connectDB();
    const developers = await Developer.find({});
    console.log("All developers in DB:");
    developers.forEach(d => {
        console.log(`- Email: ${d.email}, isVerified: ${d.isVerified}`);
    });
    await mongoose.connection.close();
}

list().catch(console.error);
