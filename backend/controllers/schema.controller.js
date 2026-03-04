const { createSchemaApiKeySchema } = require('../utils/input.validation');
const Project = require('../models/Project');
const { v4: uuidv4 } = require('uuid');
const { deleteProjectById, setProjectById, deleteProjectByApiKeyCache } = require('../services/redisCaching');
const { z } = require('zod');

module.exports.checkSchema = async (req, res) => {
    try {
        const { collectionName } = req.params;
        const project = req.project;

        if (!project) return res.status(401).json({ error: "Project missing from request." });

        const collectionConfig = project.collections.find(c => c.name === collectionName);

        if (!collectionConfig) {
            return res.status(404).json({ error: "Schema/Collection not found" });
        }

        res.status(200).json({ message: "Schema exists", collection: collectionConfig });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports.createSchema = async (req, res) => {
    try {
        const { name, fields } = createSchemaApiKeySchema.parse(req.body);
        let project = req.project;

        const projectId = project._id;
        const fullProject = await Project.findById(projectId);

        if (!fullProject) return res.status(404).json({ error: 'Project not found' });

        const exists = fullProject.collections.find(c => c.name === name);
        if (exists) return res.status(400).json({ error: 'Collection/Schema already exists' });

        if (!fullProject.jwtSecret) fullProject.jwtSecret = uuidv4();

        const transformedFields = (fields || []).map(f => {
            const mappedType = f.type.charAt(0).toUpperCase() + f.type.slice(1).toLowerCase();
            return {
                key: f.name,
                type: mappedType,
                required: f.required === true
            };
        });

        fullProject.collections.push({ name: name, model: transformedFields });
        await fullProject.save();

        // Clear redis cache
        await deleteProjectById(projectId.toString());
        await setProjectById(projectId.toString(), fullProject);
        await deleteProjectByApiKeyCache(fullProject.publishableKey); 
        await deleteProjectByApiKeyCache(fullProject.secretKey); 
        if (req.hashedApiKey) {
            await deleteProjectByApiKeyCache(req.hashedApiKey);
        }

        const projectObj = fullProject.toObject();
        delete projectObj.publishableKey;
        delete projectObj.secretKey;
        delete projectObj.jwtSecret;

        res.status(201).json({ message: "Schema created successfully", project: projectObj });
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
