"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlainObject = exports.recursiveToCamel = exports.resolveResponse = exports.resolveFetch = void 0;
const resolveFetch = (customFetch) => {
    if (customFetch) {
        return (...args) => customFetch(...args);
    }
    return (...args) => fetch(...args);
};
exports.resolveFetch = resolveFetch;
const resolveResponse = () => {
    return Response;
};
exports.resolveResponse = resolveResponse;
const recursiveToCamel = (item) => {
    if (Array.isArray(item)) {
        return item.map((el) => (0, exports.recursiveToCamel)(el));
    }
    else if (typeof item === 'function' || item !== Object(item)) {
        return item;
    }
    const result = {};
    Object.entries(item).forEach(([key, value]) => {
        const newKey = key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, ''));
        result[newKey] = (0, exports.recursiveToCamel)(value);
    });
    return result;
};
exports.recursiveToCamel = recursiveToCamel;
/**
 * Determine if input is a plain object
 * An object is plain if it's created by either {}, new Object(), or Object.create(null)
 * source: https://github.com/sindresorhus/is-plain-obj
 */
const isPlainObject = (value) => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return ((prototype === null ||
        prototype === Object.prototype ||
        Object.getPrototypeOf(prototype) === null) &&
        !(Symbol.toStringTag in value) &&
        !(Symbol.iterator in value));
};
exports.isPlainObject = isPlainObject;
//# sourceMappingURL=helpers.js.map