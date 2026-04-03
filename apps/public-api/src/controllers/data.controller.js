const {
    sanitize,
    Project,
    getConnection,
    getCompiledModel,
    QueryEngine,
    validateData,
    validateUpdateData,
    Developer,
    checkAndNotify,
    calculateExternalDbSize,
    isProjectDbExternal,
} = require("@urbackend/common");
const mongoose = require('mongoose');
const { performance } = require('perf_hooks');

const isDebug = process.env.DEBUG === 'true';

// Validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

  // INSERT DATA
module.exports.insertData = async (req, res) => {
    try {
        let start;
        if (isDebug) start = performance.now();
        const { collectionName } = req.params;
        const project = req.project;

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) return res.status(404).json({ error: "Collection not found" });

        const schemaRules = collectionConfig.model;
        const incomingData = req.body;

        // Recursive validation for all field types
        const { error, cleanData } = validateData(incomingData, schemaRules);
        if (error) return res.status(400).json({ error });

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

        // Fire-and-forget: check if a limit-warning email should be sent
        Developer.findById(project.owner).select('email').then(async (owner) => {
            if (owner?.email) {
                const currentUsage = project.resources.db.isExternal
                    ? await calculateExternalDbSize(project)
                    : (project.databaseUsed || 0) + docSize;
                checkAndNotify({
                    project,
                    resourceType: 'database',
                    currentUsage,
                    ownerEmail: owner.email,
                }).catch((e) => console.error('[data] notification error:', e.message));
            }
        }).catch(() => {}); // swallow lookup errors

        if (isDebug) console.log(`[DEBUG] insert data took ${(performance.now() - start).toFixed(2)}ms`);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// GET ALL DATA
module.exports.getAllData = async (req, res) => {
    try {
        let start;
        if (isDebug) start = performance.now();
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
        if (isDebug) console.log(`[DEBUG] getall took ${(performance.now() - start).toFixed(2)}ms`);
        res.json(data);
    } catch (err) {
        console.error(err);
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
        console.error(err);
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

        // Recursive validation for all field types
        const schemaRules = collectionConfig.model;
        const { error: validationError, updateData } = validateUpdateData(incomingData, schemaRules);
        if (validationError) return res.status(400).json({ error: validationError });

        const sanitizedData = sanitize(updateData);

        const result = await Model.findByIdAndUpdate(id, { $set: sanitizedData }, { new: true }).lean();
        if (!result) return res.status(404).json({ error: "Document not found." });

        res.json({ message: "Updated", data: result });
    } catch (err) {
        console.error(err);
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
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};