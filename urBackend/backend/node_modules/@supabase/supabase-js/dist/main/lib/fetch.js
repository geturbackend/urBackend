"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithAuth = exports.resolveHeadersConstructor = exports.resolveFetch = void 0;
const resolveFetch = (customFetch) => {
    if (customFetch) {
        return (...args) => customFetch(...args);
    }
    return (...args) => fetch(...args);
};
exports.resolveFetch = resolveFetch;
const resolveHeadersConstructor = () => {
    return Headers;
};
exports.resolveHeadersConstructor = resolveHeadersConstructor;
const fetchWithAuth = (supabaseKey, getAccessToken, customFetch) => {
    const fetch = (0, exports.resolveFetch)(customFetch);
    const HeadersConstructor = (0, exports.resolveHeadersConstructor)();
    return async (input, init) => {
        var _a;
        const accessToken = (_a = (await getAccessToken())) !== null && _a !== void 0 ? _a : supabaseKey;
        let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
        if (!headers.has('apikey')) {
            headers.set('apikey', supabaseKey);
        }
        if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${accessToken}`);
        }
        return fetch(input, Object.assign(Object.assign({}, init), { headers }));
    };
};
exports.fetchWithAuth = fetchWithAuth;
//# sourceMappingURL=fetch.js.map