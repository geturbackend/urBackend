const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { redis } = require('@urbackend/common');
const {
    getRefreshSessionKey,
    getUserSessionsKey,
    getRefreshSession,
    persistRefreshSession,
    revokeSessionChain
} = require('@urbackend/common');

const ACCESS_TOKEN_EXPIRES_IN = process.env.PUBLIC_AUTH_ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.PUBLIC_AUTH_REFRESH_TOKEN_TTL_SECONDS || 7 * 24 * 60 * 60);

const getRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000
});

const clearCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});

const getCsrfCookieOptions = () => ({
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000
});

const clearCsrfCookieOptions = () => ({
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const toProjectIdString = (projectId) => projectId?.toString?.() || String(projectId);

const signAccessToken = (project, userId) =>
    jwt.sign(
        { userId, projectId: project._id },
        project.jwtSecret,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

const generateRefreshToken = () => {
    const tokenId = crypto.randomUUID();
    const secret = crypto.randomBytes(32).toString('hex');
    return {
        tokenId,
        rawToken: `${tokenId}.${secret}`
    };
};

const MAX_IP_LENGTH = 100;

const readRequestIp = (req) => {
    if (req?.ip) {
        return req.ip;
    }

    const headers = req?.headers || {};
    const xffRaw = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
    if (typeof xffRaw === 'string' && xffRaw.length > 0) {
        const firstIp = xffRaw.split(',')[0].trim();
        if (firstIp) {
            return firstIp.slice(0, MAX_IP_LENGTH);
        }
    }

    if (req?.socket?.remoteAddress) {
        return req.socket.remoteAddress;
    }

    return 'unknown';
};

const shouldExposeRefreshToken = (req) => req.header('x-refresh-token-mode') === 'header';

const readRefreshTokenFromRequest = (req) => {
    const fromCookie = req.cookies?.refreshToken || null;
    const fromHeader = req.header('x-refresh-token');
    return fromCookie || fromHeader || null;
};

const parseRefreshToken = (rawToken) => {
    if (!rawToken || typeof rawToken !== 'string') return null;
    const [tokenId, tokenSecret] = rawToken.split('.');
    if (!tokenId || !tokenSecret) return null;
    return { tokenId, tokenSecret };
};

const saveRefreshSession = async ({ tokenId, rawToken, projectId, userId, rotatedFrom = null, isUsed = false, rotatedTo = null, ip = null, userAgent = null }) => {
    const nowIso = new Date().toISOString();
    const session = {
        tokenId,
        projectId: toProjectIdString(projectId),
        userId: String(userId),
        tokenHash: hashRefreshToken(rawToken),
        rotatedFrom,
        rotatedTo,
        isUsed,
        revokedAt: null,
        ip,
        userAgent,
        createdAt: nowIso,
        lastUsedAt: nowIso,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString()
    };
    await redis.set(getRefreshSessionKey(tokenId), JSON.stringify(session), 'EX', REFRESH_TOKEN_TTL_SECONDS);
    await redis.sadd(getUserSessionsKey(projectId, userId), tokenId);
    return session;
};

const incrementRateCounter = async (key, windowSeconds) => {
    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, windowSeconds);
    }
    return Number(count);
};

const assertRefreshRateLimits = async ({ req, tokenId, userId }) => {
    const ip = String(readRequestIp(req));
    const ipCount = await incrementRateCounter(`ratelimit:refresh:ip:${ip}`, 60);
    if (ipCount > 30) return { limited: true, message: 'Too many refresh attempts from this IP' };

    if (tokenId) {
        const tokenCount = await incrementRateCounter(`ratelimit:refresh:token:${tokenId}`, 60);
        if (tokenCount > 10) return { limited: true, message: 'Too many refresh attempts for this token' };
    }

    if (userId) {
        const userCount = await incrementRateCounter(`ratelimit:refresh:user:${String(userId)}`, 60);
        if (userCount > 20) return { limited: true, message: 'Too many refresh attempts for this user' };
    }

    return { limited: false };
};



const clearRefreshCookie = (res) => {
    res.clearCookie('refreshToken', clearCookieOptions());
    res.clearCookie('csrfToken', clearCsrfCookieOptions());
};

const safeTokenEqual = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

const extractOrigin = (rawHeader) => {
    if (!rawHeader || typeof rawHeader !== 'string') return null;
    try {
        return new URL(rawHeader).origin;
    } catch {
        return null;
    }
};

const isOriginExplicitlyTrusted = (origin, project) => {
    if (!origin || !project) return false;
    const siteOrigin = extractOrigin(project.siteUrl);
    if (siteOrigin && origin === siteOrigin) {
        return true;
    }

    const allowedDomains = Array.isArray(project.allowedDomains) ? project.allowedDomains : [];
    if (allowedDomains.includes('*')) {
        return false;
    }

    try {
        const parsedOrigin = new URL(origin);
        return allowedDomains.some((domain) => {
            const cleanDomain = String(domain || '').trim().replace(/\/$/, '');
            if (!cleanDomain) return false;
            if (cleanDomain.startsWith('*.')) {
                const baseDomain = cleanDomain.slice(2);
                return parsedOrigin.hostname === baseDomain || parsedOrigin.hostname.endsWith(`.${baseDomain}`);
            }
            return parsedOrigin.origin === cleanDomain || parsedOrigin.hostname === cleanDomain;
        });
    } catch {
        return false;
    }
};

/**
 * Validate CSRF protections when a request authenticates via the httpOnly refreshToken cookie.
 * Header-based refresh requests (`x-refresh-token`) are exempt to preserve non-browser clients.
 */
const validateCookieCsrf = (req) => {
    const usingHeaderToken = !!req.header?.('x-refresh-token');
    const usingCookieToken = !!req.cookies?.refreshToken && !usingHeaderToken;
    if (!usingCookieToken) {
        return { valid: true };
    }

    const csrfCookie = req.cookies?.csrfToken;
    const csrfHeader = req.header?.('x-csrf-token');
    const hasValidCsrfToken = !!(csrfCookie && csrfHeader && safeTokenEqual(csrfCookie, csrfHeader));

    if (csrfCookie && !hasValidCsrfToken) {
        return { valid: false, message: 'Forbidden: Invalid or missing CSRF token' };
    }

    const secFetchSite = req.header?.('sec-fetch-site');
    const requestOrigin = extractOrigin(req.headers?.origin || req.headers?.referer);

    if (secFetchSite === 'cross-site' && !hasValidCsrfToken && !isOriginExplicitlyTrusted(requestOrigin, req.project)) {
        return { valid: false, message: 'Forbidden: Cross-site cookie request rejected' };
    }

    const siteOrigin = extractOrigin(req.project?.siteUrl);
    const hasWildcardDomains = !Array.isArray(req.project?.allowedDomains) || req.project.allowedDomains.includes('*');
    if (requestOrigin && siteOrigin && hasWildcardDomains && requestOrigin !== siteOrigin && !hasValidCsrfToken) {
        return { valid: false, message: 'Forbidden: Request origin does not match project siteUrl' };
    }

    return { valid: true };
};

const issueAuthTokens = async ({ project, userId, req, res, rotatedFrom = null }) => {
    const accessToken = signAccessToken(project, userId);
    const { tokenId, rawToken } = generateRefreshToken();
    
    let ip = null;
    let userAgent = null;
    if (req) {
        ip = readRequestIp(req);
        userAgent = req.headers?.['user-agent'] || 'unknown';
    }

    await saveRefreshSession({
        tokenId,
        rawToken,
        projectId: project._id,
        userId,
        rotatedFrom,
        ip,
        userAgent
    });

    res.cookie('refreshToken', rawToken, getRefreshCookieOptions());
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', csrfToken, getCsrfCookieOptions());
    return {
        accessToken,
        refreshToken: rawToken,
        csrfToken,
        tokenId,
        expiresIn: ACCESS_TOKEN_EXPIRES_IN
    };
};

module.exports = {
    assertRefreshRateLimits,
    clearRefreshCookie,
    hashRefreshToken,
    issueAuthTokens,
    parseRefreshToken,
    readRefreshTokenFromRequest,
    shouldExposeRefreshToken,
    validateCookieCsrf
};
