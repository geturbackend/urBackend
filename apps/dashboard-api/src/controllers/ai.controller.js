const { Project, Developer } = require('@urbackend/common/src/models');
const { forwardToPythonService } = require('../utils/internalPythonClient');
const { AppError, ApiResponse, getProjectAccessQuery, resolveEffectivePlan } = require('@urbackend/common');
const redis = require('@urbackend/common/src/config/redis');
const { decrypt } = require('@urbackend/common/src/utils/encryption');
const { encryptForTransit } = require('../utils/transitEncryption');

/**
 * Controller to handle AI Query Builder requests.
 */
const queryBuilder = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { collectionName, prompt } = req.body;

        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new AppError(400, "Invalid project ID");
        }

        if (typeof collectionName !== 'string' || typeof prompt !== 'string') {
            throw new AppError(400, "Collection name and prompt must be strings");
        }

        const safeCollectionName = collectionName.trim();
        const safePrompt = prompt.trim();

        if (!safeCollectionName || !safePrompt) {
            throw new AppError(400, "Collection name and prompt are required");
        }
        if (safePrompt.length > 1000) {
           throw new AppError(400, "Prompt exceeds the maximum allowed length of 1000 characters");
       }

        if (safeCollectionName === 'users') {
            throw new AppError(403, "Cannot query the users collection via AI");
        }

        // 1. Load collection and project details
        const project = await Project.findOne({
            _id: projectId,
            ...getProjectAccessQuery(req.user._id)
        });

        if (!project) {
            throw new AppError(404, "Project not found or access denied");
        }

        const collection = project.collections.find(
            col => col.name.toLowerCase() === safeCollectionName.toLowerCase()
        );

        if (!collection) {
            throw new AppError(404, `Collection '${safeCollectionName}' not found in this project`);
        }

        // Allowed fields whitelist for output validation
        const allowedFields = new Set([
            ...collection.model.map(field => field.key),
            '_id',
            'createdAt',
            'updatedAt'
        ]);
        
        // 2. Extract simplified schema fields for the LLM
        // We only send key and type to save tokens and prevent confusion
        const schemaFields = collection.model.map(field => ({
            key: field.key,
            type: field.type
        }));
        
        // Add implicit MongoDB fields
        schemaFields.push(
            { key: "_id", type: "OBJECTID" },
            { key: "createdAt", type: "DATE" },
            { key: "updatedAt", type: "DATE" }
        );

        // ── Hierarchical BYOK Resolution ──
        let resolvedKey = null;

        // 1. Check project-level BYOK
        const projectByok = await Project.findOne({
            _id: projectId,
            ...getProjectAccessQuery(req.user._id)
        })
            .select('+byok.groqKey.encrypted +byok.groqKey.iv +byok.groqKey.tag')
            .lean();
        if (projectByok?.byok?.groqKey?.encrypted) {
            resolvedKey = decrypt(projectByok.byok.groqKey);
        }

        // 2. Fallback to developer-level BYOK
        const dev = await Developer.findById(req.user._id).select('+byok');
        if (!resolvedKey && dev?.byok?.groqKey?.encrypted) {
            resolvedKey = decrypt(dev.byok.groqKey);
        }

        // 3. Encrypt for secure transit to Python
        const encryptedByok = resolvedKey
            ? { groqKey: encryptForTransit(resolvedKey) }
            : null;

        // Resolve effective plan dynamically based on DB (handling subscription expiry safely)
        const effectivePlan = dev ? resolveEffectivePlan(dev) : 'free';

        // 3. Forward request to Python Service
        const aiResponse = await forwardToPythonService('/ai/query-builder', {
            prompt: safePrompt,
            schema_fields: schemaFields,
            developer_id: req.user._id.toString(),
            plan: effectivePlan,
            encrypted_byok: encryptedByok
        });

        // 4. Return the structured JSON to the frontend
        // Ensure filters is always an array to prevent frontend crash
        const rawFilters = Array.isArray(aiResponse.filters) ? aiResponse.filters : [];
        const allowedOperators = new Set(['=', '_gt', '_lt', '_gte', '_lte', '_ne', '_regex']);
        const safeFilters = rawFilters.filter(f => {
            const isPrimitiveValue = ['string', 'number', 'boolean'].includes(typeof f?.value);
            return (
                f &&
                typeof f.field === 'string' &&
                typeof f.operator === 'string' &&
                allowedFields.has(f.field) &&
                allowedOperators.has(f.operator) &&
                isPrimitiveValue
            );
        });

        return new ApiResponse({
            filters: safeFilters,
            sort: typeof aiResponse.sort === 'string' ? aiResponse.sort : '-createdAt'
        }, "Query built successfully").send(res);

    } catch (error) {
        // Forward expected AppErrors
        if (error instanceof AppError) {
            return next(error);
        }
        
        // Wrap Python/Axios errors
        if (error.response && error.response.data) {
            console.error("AI Service returned error:", error.response.status, error.response.data);
            
            let errorMessage = "AI Service Error";
            if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else if (error.response.data.detail) {
                errorMessage = typeof error.response.data.detail === 'string' ? error.response.data.detail : JSON.stringify(error.response.data.detail);
            } else {
                errorMessage = JSON.stringify(error.response.data);
            }
            
            return next(new AppError(error.response.status || 500, errorMessage));
        }

        console.error("AI Query Builder unexpected error:", error);
        next(new AppError(500, "Failed to build query via AI"));
    }
};

const ccSessionKey = (projectId, developerId) =>
  `ai:cc:session:${projectId}:${developerId}`;

const collectionCreator = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { userMessage } = req.body;

        if (typeof userMessage !== 'string' || userMessage.trim().length === 0) {
            throw new AppError(400, "User message is required");
        }
        if (userMessage.length > 2000) {
            throw new AppError(400, "Message exceeds the maximum allowed length of 2000 characters");
        }
        const safeUserMessage = userMessage.trim();

        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new AppError(400, "Invalid project ID");
        }

        // 1. Check access
        const project = await Project.findOne({
            _id: projectId,
            ...getProjectAccessQuery(req.user._id)
        }).select('+byok.groqKey.encrypted +byok.groqKey.iv +byok.groqKey.tag');

        if (!project) {
            throw new AppError(404, "Project not found or access denied");
        }

        // 2. Load Redis session
        const sessionKey = ccSessionKey(projectId, req.user._id);
        const sessionStr = await redis.get(sessionKey);
        let session = sessionStr ? JSON.parse(sessionStr) : { messages: [], iterations: 0, hasByok: false };

        // 3. BYOK resolution
        let resolvedKey = null;
        if (project.byok?.groqKey?.encrypted) {
            resolvedKey = decrypt(project.byok.groqKey);
        } else {
            const dev = await Developer.findById(req.user._id).select('+byok');
            if (dev?.byok?.groqKey?.encrypted) {
                resolvedKey = decrypt(dev.byok.groqKey);
            }
        }

        const encryptedByok = resolvedKey ? { groqKey: encryptForTransit(resolvedKey) } : null;
        const hasByok = !!encryptedByok;

        // 4. Iteration limit check
        const PLATFORM_ITERATION_LIMIT = 3;
        if (!hasByok && session.iterations >= PLATFORM_ITERATION_LIMIT) {
            throw new AppError(403, "AI iteration limit reached (3/3 on platform key). Add your Groq API key in Settings for unlimited usage.");
        }

        // 5. Update session
        session.messages.push({ role: "user", content: safeUserMessage });
        session.hasByok = hasByok;
        if (session.messages.length > 50) {
             session.messages = session.messages.slice(-50);
        }

        const dev = await Developer.findById(req.user._id).select('+byok +plan +trialEndsAt +subscriptionId');
        const effectivePlan = dev ? resolveEffectivePlan(dev) : 'free';

        // 6. Forward request
        const aiResponse = await forwardToPythonService('/ai/collection-creator', {
            messages: session.messages,
            developer_id: req.user._id.toString(),
            plan: effectivePlan,
            encrypted_byok: encryptedByok
        });

        const allowedTypes = new Set(['String', 'Number', 'Boolean', 'Date', 'Object', 'Array', 'Ref']);
        let safeSchema = null;
        
        if (['schema', 'complete'].includes(aiResponse.type) && Array.isArray(aiResponse.schema)) {
            safeSchema = aiResponse.schema
                .filter(c => c.collection && c.collection.toLowerCase() !== 'users')
                .map(c => {
                    return {
                        collection: c.collection,
                        fields: (c.fields || []).filter(f => f.name && allowedTypes.has(f.type)).map(f => {
                           const fieldDef = {
                               name: f.name,
                               type: f.type,
                               required: !!f.required
                           };
                           if (f.type === 'Ref' && f.ref) {
                               fieldDef.ref = f.ref;
                           }
                           return fieldDef;
                        })
                    };
                });
        }

        // 7. Save session
        session.messages.push({ role: "assistant", content: aiResponse.message });
        if (!hasByok) {
           session.iterations += 1;
        }
        await redis.set(sessionKey, JSON.stringify(session), 'EX', 7200);

        return new ApiResponse({
            type: aiResponse.type,
            message: aiResponse.message,
            schema: safeSchema,
            iterationsLeft: hasByok ? null : Math.max(0, PLATFORM_ITERATION_LIMIT - session.iterations)
        }, "Agent responded successfully").send(res);

    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        
        if (error.response && error.response.data) {
            console.error("AI Service returned error:", error.response.status, error.response.data);
            
            let errorMessage = "AI Service Error";
            if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else if (error.response.data.detail) {
                errorMessage = typeof error.response.data.detail === 'string' ? error.response.data.detail : JSON.stringify(error.response.data.detail);
            } else {
                errorMessage = JSON.stringify(error.response.data);
            }
            
            return next(new AppError(error.response.status || 500, errorMessage));
        }

        console.error("AI Collection Creator unexpected error:", error);
        next(new AppError(500, "Failed to chat with AI agent"));
    }
};

const clearCollectionCreatorSession = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        await redis.del(ccSessionKey(projectId, req.user._id));
        return new ApiResponse({}, "Session cleared").send(res);
    } catch(err) {
        console.error("clearCollectionCreatorSession error", err);
        return next(new AppError(500, "Failed to clear session"));
    }
};

module.exports = {
    queryBuilder,
    collectionCreator,
    clearCollectionCreatorSession
};
