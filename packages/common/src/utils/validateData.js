const mongoose = require('mongoose');

const normalizeKey = (key) => String(key || '').replace(/\uFEFF/g, '').trim();

const buildIncomingMaps = (incomingData = {}) => {
    const normalizedValueMap = new Map();
    const canonicalKeyMap = new Map();

    for (const [rawKey, value] of Object.entries(incomingData)) {
        const normalized = normalizeKey(rawKey);
        if (!normalized) continue;
        if (!normalizedValueMap.has(normalized)) {
            normalizedValueMap.set(normalized, value);
            canonicalKeyMap.set(normalized, rawKey);
        }
    }

    return { normalizedValueMap, canonicalKeyMap };
};

// Recursive data validator for schema fields
// Returns error string or null if valid
function validateField(value, field) {
    if (field.required && (value === undefined || value === null)) {
        return `Field '${field.key}' is required.`;
    }
    if (value === undefined || value === null) return null;

    switch (field.type) {
        case 'String':
            if (typeof value !== 'string') return `Field '${field.key}' must be a String.`;
            break;
        case 'Number':
            if (typeof value !== 'number') return `Field '${field.key}' must be a Number.`;
            break;
        case 'Boolean':
            if (typeof value !== 'boolean') return `Field '${field.key}' must be a Boolean.`;
            break;
        case 'Date':
            if (isNaN(Date.parse(value))) return `Field '${field.key}' must be a valid Date.`;
            break;
        case 'Object':
            if (typeof value !== 'object' || Array.isArray(value)) {
                return `Field '${field.key}' must be an Object.`;
            }
            if (field.fields && field.fields.length > 0) {
                for (const subField of field.fields) {
                    const err = validateField(value[subField.key], subField);
                    if (err) return err;
                }
            }
            break;
        case 'Array':
            if (!Array.isArray(value)) {
                return `Field '${field.key}' must be an Array.`;
            }
            if (field.items) {
                for (let i = 0; i < value.length; i++) {
                    const itemField = {
                        key: `${field.key}[${i}]`,
                        type: field.items.type,
                        required: false,
                        fields: field.items.fields || undefined,
                    };
                    const err = validateField(value[i], itemField);
                    if (err) return err;
                }
            }
            break;
        case 'Ref':
            if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
                return `Field '${field.key}' must be a valid reference ID (ObjectId).`;
            }
            break;
    }
    return null;
}

// Validate incoming data against schema rules
// Returns { error } or { cleanData }
function validateData(incomingData, schemaRules) {
    const cleanData = { ...incomingData }; // Start with all data
    const { normalizedValueMap } = buildIncomingMaps(incomingData);

    for (const field of schemaRules) {
        const fieldKey = normalizeKey(field.key);
        const value = normalizedValueMap.has(fieldKey)
            ? normalizedValueMap.get(fieldKey)
            : incomingData[field.key];

        const error = validateField(value, field);
        if (error) return { error };


        if (value !== undefined) {
            cleanData[field.key] = value;
        }
    }
    return { cleanData };
}

// Validate partial update data (non-required fields can be missing)
function validateUpdateData(incomingData, schemaRules) {
    const updateData = { ...incomingData }; // Start with all data
    const { normalizedValueMap } = buildIncomingMaps(incomingData);
    const normalizedSchemaMap = new Map(
        schemaRules.map((f) => [normalizeKey(f.key), f])
    );

    for (const [normalizedKey, value] of normalizedValueMap.entries()) {
        const fieldRule = normalizedSchemaMap.get(normalizedKey);
        if (!fieldRule) continue; // Allow extra fields

        // For updates, don't enforce 'required' — only validate type
        const tempField = { ...fieldRule, required: false };
        const error = validateField(value, tempField);
        if (error) return { error };

        updateData[fieldRule.key] = value;
    }
    return { updateData };
}

module.exports = { validateField, validateData, validateUpdateData };
