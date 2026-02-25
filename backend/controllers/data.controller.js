const { sanitize } = require("../utils/input.validation");
const mongoose = require('mongoose');
const Project = require("../models/Project");
const { getConnection } = require("../utils/connection.manager");
const { getCompiledModel } = require("../utils/injectModel");
const QueryEngine = require("../utils/queryEngine");

// Validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// INSERT DATA
module.exports.insertData = async (req, res) => {
    try {
        console.time("insert data")
        const { collectionName } = req.params;
        const project = req.project;

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) return res.status(404).json({ error: "Collection not found" });

        const schemaRules = collectionConfig.model;
        const incomingData = req.body;
        const cleanData = {};

        for (const field of schemaRules) {
            const value = incomingData[field.key];

            if (field.required && (value === undefined || value === null)) {
                return res.status(400).json({ error: `Field '${field.key}' is required.` });
            }

            if (value !== undefined) {
                // Strong Type Checks (Added String and Date)
                if (field.type === 'Number' && typeof value !== 'number') return res.status(400).json({ error: `Field '${field.key}' must be a Number.` });
                if (field.type === 'Boolean' && typeof value !== 'boolean') return res.status(400).json({ error: `Field '${field.key}' must be a Boolean.` });
                if (field.type === 'String' && typeof value !== 'string') return res.status(400).json({ error: `Field '${field.key}' must be a String.` });
                if (field.type === 'Date' && isNaN(Date.parse(value))) return res.status(400).json({ error: `Field '${field.key}' must be a valid Date.` });

                cleanData[field.key] = value;
            }
        }

        // Prevnt NoSQL injection
        const safeData = sanitize(cleanData);

        let docSize = 0;
        if (!project.resources.db.isExternal) {
            docSize = Buffer.byteLength(JSON.stringify(safeData));
            if ((project.databaseUsed || 0) + docSize > project.databaseLimit) {
                return res.status(403).json({ error: "Database limit exceeded." });
            }
        }

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, collectionConfig, project._id, project.resources.db.isExternal);

        const result = await Model.create(safeData);

        if (!project.resources.db.isExternal) {
            await Project.updateOne(
                { _id: project._id },
                { $inc: { databaseUsed: docSize } }
            );
        }

        console.timeEnd("insert data")
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL DATA
module.exports.getAllData = async (req, res) => {
    try {
        console.time("getall")
        const { collectionName } = req.params;
        const project = req.project;

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) return res.status(404).json({ error: "Collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, collectionConfig, project._id, project.resources.db.isExternal);

        const features = new QueryEngine(Model.find(), req.query)
            .filter()
            .sort()
            .paginate();

        const data = await features.query.lean();
        console.timeEnd("getall")
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET SINGLE DOC
module.exports.getSingleDoc = async (req, res) => {
    try {
        const { collectionName, id } = req.params;
        const project = req.project;

        // ensure valid mongose objct id
        if (!isValidId(id)) return res.status(400).json({ error: "Invalid ID format." });

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) return res.status(404).json({ error: "Collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, collectionConfig, project._id, project.resources.db.isExternal);

        const doc = await Model.findById(id).lean();
        if (!doc) return res.status(404).json({ error: "Document not found." });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE DATA
module.exports.updateSingleData = async (req, res) => {
    try {
        const { collectionName, id } = req.params;
        const project = req.project;
        const incomingData = req.body;

        if (!isValidId(id)) return res.status(400).json({ error: "Invalid ID format." });

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) return res.status(404).json({ error: "Collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, collectionConfig, project._id, project.resources.db.isExternal);

        // Strict Schema Validation
        const schemaRules = collectionConfig.model;
        const updateData = {};
        for (const key in incomingData) {
            const fieldRule = schemaRules.find(f => f.key === key);
            if (!fieldRule) continue; // Unknown fields ko ignore karo

            const value = incomingData[key];
            if (fieldRule.type === 'Number' && typeof value !== 'number') return res.status(400).json({ error: `Field '${key}' must be a Number.` });
            if (fieldRule.type === 'Boolean' && typeof value !== 'boolean') return res.status(400).json({ error: `Field '${key}' must be a Boolean.` });
            if (fieldRule.type === 'String' && typeof value !== 'string') return res.status(400).json({ error: `Field '${key}' must be a String.` });

            updateData[key] = value;
        }

        const sanitizedData = sanitize(updateData);

        const result = await Model.findByIdAndUpdate(id, { $set: sanitizedData }, { new: true }).lean();
        if (!result) return res.status(404).json({ error: "Document not found." });

        res.json({ message: "Updated", data: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE DATA
module.exports.deleteSingleDoc = async (req, res) => {
    try {
        const { collectionName, id } = req.params;
        const project = req.project;

        if (!isValidId(id)) return res.status(400).json({ error: "Invalid ID format." });

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) return res.status(404).json({ error: "Collection not found" });

        const connection = await getConnection(project._id);
        const Model = getCompiledModel(connection, collectionConfig, project._id, project.resources.db.isExternal);

        const docToDelete = await Model.findById(id);
        if (!docToDelete) return res.status(404).json({ error: "Document not found." });

        let docSize = 0;
        if (!project.resources.db.isExternal) {
            docSize = Buffer.byteLength(JSON.stringify(docToDelete));
        }

        await Model.deleteOne({ _id: id });

        if (!project.resources.db.isExternal) {
            let databaseUsed = Math.max(0, (project.databaseUsed || 0) - docSize);
            await Project.updateOne(
                { _id: project._id },
                { $set: { databaseUsed } }
            );
        }

        res.json({ message: "Document deleted", id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};