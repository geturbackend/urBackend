const mongoose = require("mongoose")
const Project = require("../models/Project")
const Developer = require("../models/Developer")
const Log = require("../models/Log")
const { getStorage } = require("../utils/storage.manager");
const { randomUUID } = require("crypto");
const { createProjectSchema, createCollectionSchema, updateExternalConfigSchema } = require('../utils/input.validation');
const { generateApiKey, hashApiKey } = require('../utils/api');
const { z } = require('zod');
const { encrypt } = require('../utils/encryption');
const { URL } = require('url');
const { getConnection } = require("../utils/connection.manager");
const { getCompiledModel } = require("../utils/injectModel")
const QueryEngine = require("../utils/queryEngine");
const { storageRegistry } = require("../utils/registry");
const { deleteProjectByApiKeyCache, setProjectById, getProjectById, deleteProjectById } = require("../services/redisCaching");
const { getPublicIp } = require("../utils/network");



const getBucket = (project) =>
    project.resources?.storage?.isExternal ? "files" : "dev-files";

const isExternalStorage = (project) =>
    !!project.resources?.storage?.isExternal;



module.exports.createProject = async (req, res) => {
    try {
        // POST FOR - PROJECT CREATION
        const { name, description } = createProjectSchema.parse(req.body);

        // --- PROJECT LIMIT CHECK ---
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        
        // GET MAX PROJECTS
        const dev = await Developer.findById(req.user._id);
        const MAX_PROJECTS = dev?.maxProjects || 3;

        const isUserAdmin = req.user.email === ADMIN_EMAIL;
        const projectCount = await Project.countDocuments({ owner: req.user._id });

        if (!isUserAdmin && projectCount >= MAX_PROJECTS) {
            return res.status(403).json({ 
                error: `Project limit reached. Your current plan allows up to ${MAX_PROJECTS} projects.`,
                limit: MAX_PROJECTS,
                current: projectCount
            });
        }
        // ---------------------------

        const rawPublishableKey = generateApiKey('pk_live_');
        const hashedPublishableKey = hashApiKey(rawPublishableKey);

        const rawSecretKey = generateApiKey('sk_live_');
        const hashedSecretKey = hashApiKey(rawSecretKey);

        const rawJwtSecret = generateApiKey('jwt_');

        const newProject = new Project({
            name,
            description,
            owner: req.user._id,
            publishableKey: hashedPublishableKey,
            secretKey: hashedSecretKey,
            jwtSecret: rawJwtSecret
        });
        await newProject.save();

        const projectObj = newProject.toObject();
        projectObj.publishableKey = rawPublishableKey;
        projectObj.secretKey = rawSecretKey;
        delete projectObj.jwtSecret;

        res.status(201).json(projectObj);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        res.status(500).json({ error: err.message });
    }
}

module.exports.getAllProject = async (req, res) => {
    try {
        const projects = await Project.find({ owner: req.user._id })
            .select('name description')
            .lean();

        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


module.exports.getSingleProject = async (req, res) => {
    try {
        let project;
        project = await getProjectById(req.params.projectId);
        let projectObj;
        if (!project) {
            project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id }).select('-publishableKey -secretKey -jwtSecret');
            if (!project) return res.status(404).json({ error: "Project not found." });
            projectObj = project.toObject();
            await setProjectById(req.params.projectId, project);
        }

        projectObj = project;
        delete projectObj.publishableKey;
        delete projectObj.secretKey;
        delete projectObj.jwtSecret;
        res.json(projectObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.regenerateApiKey = async (req, res) => {
    try {
        const { keyType } = req.body; // 'publishable' or 'secret'
        
        if (keyType !== 'publishable' && keyType !== 'secret') {
            return res.status(400).json({ error: "Invalid keyType. Must be 'publishable' or 'secret'." });
        }

        const prefix = keyType === 'publishable' ? 'pk_live_' : 'sk_live_';
        const newApiKey = generateApiKey(prefix);
        const hashed = hashApiKey(newApiKey);

        const oldApiProj = await Project.findOne({ _id: req.params.projectId, owner: req.user._id })
            .select('publishableKey secretKey');
        if (!oldApiProj) return res.status(404).json({ error: "Project not found." });
        
        // CLEAR CACHE
        await deleteProjectByApiKeyCache(oldApiProj.publishableKey);
        await deleteProjectByApiKeyCache(oldApiProj.secretKey);

        const updateField = keyType === 'publishable' ? { publishableKey: hashed } : { secretKey: hashed };

        const project = await Project.findOneAndUpdate(
            { _id: req.params.projectId, owner: req.user._id },
            { $set: updateField },
            { new: true }
        );
        if (!project) return res.status(404).json({ error: "Project not found." });

        const projectObj = project.toObject();
        delete projectObj.publishableKey;
        delete projectObj.secretKey;
        delete projectObj.jwtSecret;
        res.json({ apiKey: newApiKey, keyType, project: projectObj });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// VALIDATE URI
const isSafeUri = (uri) => {
    try {
        const parsed = new URL(uri);
        const host = parsed.hostname.toLowerCase();
        const badHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
        return !badHosts.includes(host);
    } catch (e) { return false; }
};



module.exports.updateExternalConfig = async (req, res) => {
    try {
        const { projectId } = req.params;

        // POST FOR - EXTERNAL CONFIG
        const validatedData = updateExternalConfigSchema.parse(req.body);
        const { dbUri, storageUrl, storageKey, storageProvider } = validatedData;

        const updateData = {};

        // DB CONFIG
        if (dbUri) {
            if (!isSafeUri(dbUri)) return res.status(400).json({ error: "DB URI is pointing to a restricted host (localhost/internal)." });

            updateData['resources.db.config'] = encrypt(JSON.stringify({ dbUri }));
            updateData['resources.db.isExternal'] = true;

            // --- VERIFY CONNECTION ---
            console.log("Verifying connection to:", projectId);
            try {
                const tempConn = mongoose.createConnection(dbUri, { serverSelectionTimeoutMS: 5000 });
                await tempConn.asPromise();
                await tempConn.close();
            } catch (connErr) {
                console.error("Verification Connection Failed:", connErr.message);
                let errorMsg = "Could not connect to the provided MongoDB URI.";

                if (connErr.message.includes("Server selection timed out") || connErr.message.includes("Could not connect")) {
                    const serverIp = await getPublicIp();
                    errorMsg = `Access Denied: Please whitelist Server IP [${serverIp}] in MongoDB Atlas.`;
                } else {
                    errorMsg += " " + connErr.message;
                }

                return res.status(400).json({ error: errorMsg });
            }
            // -------------------------
        }

        // STORAGE CONFIG
        if (storageUrl && storageKey) {
            const storageConfig = {
                storageUrl,
                storageKey,
                storageProvider: storageProvider || 'supabase'
            };
            updateData['resources.storage.config'] = encrypt(JSON.stringify(storageConfig));
            updateData['resources.storage.isExternal'] = true;
        }

        const project = await Project.findOneAndUpdate(
            { _id: projectId, owner: req.user._id },
            { $set: updateData },
            { new: true }
        );

        if (!project) return res.status(404).json({ error: "Project not found or access denied." });

        res.status(200).json({ message: "External configuration updated successfully." });
    } catch (err) {
        if (err.name === 'ZodError') {
            return res.status(400).json({
                error: err.errors?.[0]?.message || err.issues?.[0]?.message || "Validation failed"
            });
        }

        console.error("External Config Error:", err);
        res.status(500).json({ error: err.message });
    }
}

module.exports.deleteExternalDbConfig = async (req, res) => {
    try {
        const parsedBody = z.object({
            projectId: z.string(),
        }).parse(req.body);
        const { projectId } = parsedBody;

        const project = await Project.findOne({ _id: { $eq: projectId }, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found or access denied." });

        project.resources.db.isExternal = false;
        project.resources.db.config = null;
        await project.save();

        res.status(200).json({ message: "External configuration deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.deleteExternalStorageConfig = async (req, res) => {
    try {
        const parsedBody = z.object({
            projectId: z.string(),
        }).parse(req.body);
        const { projectId } = parsedBody;

        const project = await Project.findOne({ _id: { $eq: projectId }, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found or access denied." });

        project.resources.storage.isExternal = false;
        project.resources.storage.config = null;

        await deleteProjectById(projectId);
        await setProjectById(projectId, project);
        await project.save();

        res.status(200).json({ message: "External configuration deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}



module.exports.createCollection = async (req, res) => {
    try {
        const { projectId, collectionName, schema } = createCollectionSchema.parse(req.body);

        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const exists = project.collections.find(c => c.name === collectionName);
        if (exists) return res.status(400).json({ error: 'Collection already exists' });

        if (!project.jwtSecret) project.jwtSecret = uuidv4();

        project.collections.push({ name: collectionName, model: schema });
        await project.save();

        await deleteProjectById(projectId);
        await setProjectById(projectId, project);
        await deleteProjectByApiKeyCache(project.publishableKey);
        await deleteProjectByApiKeyCache(project.secretKey);
        // RESPONSE
        const projectObj = project.toObject();
        delete projectObj.publishableKey;
        delete projectObj.secretKey;
        delete projectObj.jwtSecret;

        res.status(201).json(projectObj);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
        res.status(500).json({ error: err.message });
    }
}

module.exports.deleteCollection = async (req, res) => {
    try {
        const { projectId, collectionName } = req.params;

        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found or access denied." });

        const collectionIndex = project.collections.findIndex(c => c.name === collectionName);
        if (collectionIndex === -1) {
            return res.status(404).json({ error: "Collection not found." });
        }

        const isExternal = project.resources?.db?.isExternal;

        const connection = await getConnection(projectId);

        const finalCollectionName = isExternal ? collectionName : `${project._id}_${collectionName}`;

        try {
            await connection.db.dropCollection(finalCollectionName);
        } catch (e) {
            console.warn("Failed to drop collection (might not exist):", finalCollectionName, e.message);
        }

        project.collections.splice(collectionIndex, 1);
        await project.save();

        await deleteProjectById(projectId);
        await setProjectById(projectId, project);

        res.json({ message: `Collection '${collectionName}' deleted successfully.` });
    } catch (err) {
        console.error("Delete Collection Error:", err);
        res.status(500).json({ error: err.message });
    }
}

module.exports.getData = async (req, res) => {
    try {
        const { projectId, collectionName } = req.params;
        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found." });

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) {
            return res.status(404).json({
                error: "Collection not found",
                collection: collectionName
            });
        }

        const connection = await getConnection(projectId);
        const model = getCompiledModel(connection, collectionConfig, projectId, project.resources.db.isExternal);

        // const collectionsList = await mongoose.connection.db.listCollections({ name: finalCollectionName }).toArray();

        const features = new QueryEngine(model.find(), req.query)
            .filter()
            .sort()
            .paginate();

        const data = await features.query.lean();

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.insertData = async (req, res) => {
    try {
        console.time("insert data")
        const { projectId, collectionName } = req.params;
        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found." });

        const finalCollectionName = `${project._id}_${collectionName}`;
        const incomingData = req.body;

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) {
            return res.status(404).json({ error: "Collection configuration not found." });
        }

        let docSize = 0;
        if (!project.resources.db.isExternal) {
            docSize = Buffer.byteLength(JSON.stringify(incomingData));

            const limit = project.databaseLimit || 20 * 1024 * 1024;

            if ((project.databaseUsed || 0) + docSize > limit) {
                return res.status(403).json({ error: "Database limit exceeded. Delete some data." });
            }
        }

        const connection = await getConnection(projectId);
        const model = getCompiledModel(connection, collectionConfig, projectId, project.resources.db.isExternal);

        const result = await model.create(incomingData);

        if (!project.resources.db.isExternal) {
            project.databaseUsed = (project.databaseUsed || 0) + docSize;
        }
        await project.save();
        await project.save();

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.deleteRow = async (req, res) => {
    try {
        const { projectId, collectionName, id } = req.params;

        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found." });

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) {
            return res.status(404).json({ error: "Collection not found." });
        }

        const connection = await getConnection(projectId);
        const Model = getCompiledModel(connection, collectionConfig, projectId, project.resources.db.isExternal);

        const docToDelete = await Model.findById(id);
        if (!docToDelete) {
            return res.status(404).json({ error: "Document not found." });
        }

        const docSize = Buffer.byteLength(JSON.stringify(docToDelete));


        await Model.deleteOne({ _id: id });

        if (!project.resources.db.isExternal) {
            project.databaseUsed = Math.max(0, (project.databaseUsed || 0) - docSize);
            await project.save();
        }

        res.json({ success: true, message: "Document deleted successfully" });

    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports.editRow = async (req, res) => {
    try {
        const { projectId, collectionName, id } = req.params;

        const project = await Project.findOne({ _id: projectId, owner: req.user._id });
        if (!project) return res.status(404).json({ error: "Project not found." });

        const collectionConfig = project.collections.find(c => c.name === collectionName);
        if (!collectionConfig) {
            return res.status(404).json({ error: "Collection not found." });
        }

        const connection = await getConnection(projectId);
        const Model = getCompiledModel(connection, collectionConfig, projectId, project.resources.db.isExternal);

        const docToEdit = await Model.findById(id);
        if (!docToEdit) {
            return res.status(404).json({ error: "Document not found." });
        }

        const oldSize = Buffer.byteLength(JSON.stringify(docToEdit.toObject()));

        docToEdit.set(req.body);

        const newSize = Buffer.byteLength(JSON.stringify(docToEdit.toObject()));
        const sizeDiff = newSize - oldSize;

        if (!project.resources.db.isExternal) {
            const limit = project.databaseLimit || 500 * 1024 * 1024;
            const currentUsed = project.databaseUsed || 0;

            if (currentUsed + sizeDiff > limit) {
                return res.status(403).json({ error: "Database limit exceeded." });
            }

            project.databaseUsed = Math.max(0, currentUsed + sizeDiff);
            await project.save();
        }

        const updatedDoc = await docToEdit.save();

        res.json({ success: true, message: "Document edited successfully", data: updatedDoc });

    } catch (err) {
        console.error("Edit Error:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports.listFiles = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findOne({ _id: projectId, owner: req.user._id })
            .select("+resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag resources.storage.isExternal storageUsed storageLimit");
        if (!project) return res.status(404).json({ error: "Project not found" });

        const supabase = await getStorage(project);
        const bucket = getBucket(project);

        const { data, error } = await supabase.storage
            .from(bucket)
            .list(`${projectId}`, {
                limit: 100,
                sortBy: { column: "created_at", order: "desc" }
            });

        if (error) throw error;

        const files = data.map(file => {
            const { data: url } = supabase.storage
                .from(bucket)
                .getPublicUrl(`${projectId}/${file.name}`);

            return {
                ...file,
                path: `${projectId}/${file.name}`,
                publicUrl: url.publicUrl
            };
        });

        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports.uploadFile = async (req, res) => {
    try {
        const { projectId } = req.params;
        const file = req.file;

        if (!file) return res.status(400).json({ error: "No file uploaded" });

        const project = await Project.findOne({ _id: projectId, owner: req.user._id })
            .select("+resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag resources.storage.isExternal storageUsed storageLimit");
        if (!project) return res.status(404).json({ error: "Project not found" });

        const external = isExternalStorage(project);

        if (!external) {
            if (project.storageUsed + file.size > project.storageLimit) {
                return res.status(403).json({ error: "Storage limit exceeded" });
            }
        }

        const supabase = await getStorage(project);
        const bucket = getBucket(project);

        const safeName = file.originalname.replace(/\s+/g, "_");
        const path = `${projectId}/${randomUUID()}_${safeName}`;

        const { error } = await supabase.storage
            .from(bucket)
            .upload(path, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) throw error;

        if (!external) {
            project.storageUsed += file.size;
            await project.save();
        }

        res.json({ success: true, path });
    } catch (err) {
        res.status(500).json({ error: err });
    }
};


module.exports.deleteFile = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { path } = req.body;

        if (!path) return res.status(400).json({ error: "Path required" });

        const project = await Project.findOne({ _id: projectId, owner: req.user._id })
            .select("+resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag resources.storage.isExternal storageUsed storageLimit");
        if (!project) return res.status(404).json({ error: "Project not found" });

        if (!path.startsWith(`${projectId}/`)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const supabase = await getStorage(project);
        const bucket = getBucket(project);
        const external = isExternalStorage(project);

        let fileSize = 0;

        if (!external) {
            const { data } = await supabase.storage
                .from(bucket)
                .list(projectId, {
                    search: path.split("/").pop()
                });

            if (data?.length) {
                fileSize = data[0]?.metadata?.size || 0;
            }
        }

        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;

        if (!external && fileSize > 0) {
            project.storageUsed = Math.max(0, project.storageUsed - fileSize);
            await project.save();
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports.deleteAllFiles = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findOne({ _id: projectId, owner: req.user._id })
            .select("+resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag resources.storage.isExternal storageUsed storageLimit");
        if (!project) return res.status(404).json({ error: "Project not found" });

        const supabase = await getStorage(project);
        const bucket = getBucket(project);

        let hasMore = true;
        let deleted = 0;

        while (hasMore) {
            const { data, error } = await supabase.storage
                .from(bucket)
                .list(projectId, { limit: 100 });

            if (error) throw error;

            if (data.length === 0) {
                hasMore = false;
            } else {
                const paths = data.map(f => `${projectId}/${f.name}`);
                await supabase.storage.from(bucket).remove(paths);
                deleted += data.length;
            }
        }

        if (!isExternalStorage(project)) {
            project.storageUsed = 0;
            await project.save();
        }

        res.json({ success: true, deleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports.updateProject = async (req, res) => {
    try {
        const { name } = req.body;
        const project = await Project.findOneAndUpdate(
            { _id: req.params.projectId, owner: req.user._id },
            { $set: { name } },
            { new: true }
        );
        if (!project) return res.status(404).json({ error: "Project not found." });
        
        await deleteProjectById(project._id.toString());
        await setProjectById(project._id.toString(), project);
        
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.updateAllowedDomains = async (req, res) => {
    try {
        const { domains } = req.body;
        if (!Array.isArray(domains) || !domains.every(d => typeof d === 'string')) {
            return res.status(400).json({ error: "domains must be an array of strings." });
        }

        const cleanedDomains = domains
            .map(d => d.trim())
            .filter(d => d.length > 0);

        const project = await Project.findOneAndUpdate(
            { _id: req.params.projectId, owner: req.user._id },
            { $set: { allowedDomains: cleanedDomains } },
            { new: true }
        );

        if (!project) return res.status(404).json({ error: "Project not found or access denied." });
        await deleteProjectById(project._id.toString());
        await setProjectById(project._id.toString(), project);
        await deleteProjectByApiKeyCache(project.publishableKey);
        await deleteProjectByApiKeyCache(project.secretKey);

        res.json({ message: "Allowed domains updated", allowedDomains: project.allowedDomains });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.deleteProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;

        const project = await Project.findOne({
            _id: projectId,
            owner: req.user._id
        }).select(
            "+resources.storage.config.encrypted " +
            "+resources.storage.config.iv " +
            "+resources.storage.config.tag"
        );

        if (!project) {
            return res.status(404).json({ error: "Project not found or access denied." });
        }
        for (const col of project.collections) {
            const collectionName = `${project._id}_${col.name}`;
            try {
                await mongoose.connection.db.dropCollection(collectionName);
            } catch (e) { }
        }

        try {
            await mongoose.connection.db.dropCollection(`${project._id}_users`);
        } catch (e) { }

        // DELETE FILES
        const supabase = await getStorage(project);
        const bucket = getBucket(project);

        let hasMoreFiles = true;

        while (hasMoreFiles) {
            const { data: files, error } = await supabase.storage
                .from(bucket)
                .list(projectId, { limit: 100 });

            if (error) throw error;

            if (files && files.length > 0) {
                const paths = files.map(f => `${projectId}/${f.name}`);
                await supabase.storage.from(bucket).remove(paths);
            } else {
                hasMoreFiles = false;
            }
        }

        await Project.deleteOne({ _id: projectId });
        storageRegistry.delete(projectId.toString());

        res.json({ message: "Project and all associated resources deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


module.exports.analytics = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findOne({ _id: projectId });
        const totalRequests = await Log.countDocuments({ projectId });
        const logs = await Log.find({ projectId }).sort({ timestamp: -1 }).limit(50);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const chartData = await Log.aggregate([
            { $match: { projectId: new mongoose.Types.ObjectId(projectId), timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            storage: { used: project.storageUsed, limit: project.storageLimit },
            database: { used: project.databaseUsed, limit: project.databaseLimit },
            totalRequests,
            logs,
            chartData
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}