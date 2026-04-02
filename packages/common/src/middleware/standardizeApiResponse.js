const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const safeStringify = (value) => {
    try {
        return JSON.stringify(value);
    } catch {
        return 'An unexpected error occurred';
    }
};

const pickMessage = (value) => {
    if (typeof value === 'string' && value.trim()) return value;

    if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === 'string' && first.trim()) return first;
        if (first && typeof first.message === 'string' && first.message.trim()) return first.message;
        if (first && typeof first.toString === 'function') {
            const text = first.toString();
            if (text && text !== '[object Object]') return text;
        }
    }

    if (value && typeof value === 'object') {
        if (typeof value.message === 'string' && value.message.trim()) return value.message;
        if (Array.isArray(value.errors) && value.errors[0]?.message) return value.errors[0].message;
        if (Array.isArray(value.issues) && value.issues[0]?.message) return value.issues[0].message;
    }

    return null;
};

const toErrorMessage = (raw) => {
    const direct = pickMessage(raw);
    if (direct) return direct;

    if (raw && typeof raw === 'object' && Object.prototype.hasOwnProperty.call(raw, 'error')) {
        const nested = pickMessage(raw.error);
        if (nested) return nested;
    }

    const serialized = safeStringify(raw);
    return serialized === '{}' || serialized === '[]' || serialized === 'null' || serialized === '""'
        ? 'Unknown error'
        : serialized;
};

module.exports = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
        const code = res.statusCode || 200;

        if (body === null || body === undefined) {
            return originalJson(body);
        }

        if (code >= 400) {
            return originalJson({
                success: false,
                error: toErrorMessage(body),
                code,
            });
        }

        return originalJson(body);
    };

    next();
};