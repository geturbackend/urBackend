const mongoose = require('mongoose');

const ReleaseSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    publishedBy: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Release', ReleaseSchema);
