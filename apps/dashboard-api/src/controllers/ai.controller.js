const { Project } = require('@urbackend/common/src/models');
const { forwardToPythonService } = require('../utils/internalPythonClient');
const { AppError } = require('@urbackend/common');

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

        // 1. Fetch the project and specifically the requested collection schema
        const project = await Project.findOne(
            { _id: projectId, owner: req.user._id, "collections.name": safeCollectionName },
            { "collections.$": 1 }
        );

        if (!project || !project.collections || project.collections.length === 0) {
            throw new AppError(404, "Collection not found or access denied");
        }

        const collection = project.collections[0];
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

        // 3. Forward request to Python Service
        const aiResponse = await forwardToPythonService('/ai/query-builder', {
            prompt: safePrompt,
            schema_fields: schemaFields
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

        res.status(200).json({
            success: true,
            data: {
                filters: safeFilters,
                sort: typeof aiResponse.sort === 'string' ? aiResponse.sort : '-createdAt'
            },
            message: "Query built successfully"
        });

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

        next(new AppError(500, "Failed to build query via AI"));
    }
};

module.exports = {
    queryBuilder
};
