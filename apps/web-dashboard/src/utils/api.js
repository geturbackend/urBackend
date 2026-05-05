import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

let csrfToken = null;
// Eagerly start fetching the CSRF token as soon as this module loads so the
// token is already available by the time the user submits any form.
let csrfTokenPromise = null;

const fetchCsrfToken = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/auth/csrf-token`, { withCredentials: true });
        csrfToken = response.data.csrfToken;
        return csrfToken;
    } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
        return null;
    }
};

// Kick off the fetch immediately — reuse the same promise to avoid duplicate requests.
csrfTokenPromise = fetchCsrfToken();

api.interceptors.request.use(async (config) => {
    const method = config.method.toLowerCase();
    
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
        if (!csrfToken) {
            // Wait for the in-flight eager fetch instead of spawning a new one.
            csrfToken = await (csrfTokenPromise ?? fetchCsrfToken());
        }
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
    }
    return config;
}, (error) => Promise.reject(error));

// Upgrade-triggering keywords from backend error messages
const UPGRADE_KEYWORDS = ['upgrade', 'limit reached', 'pro feature', 'pro plan'];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        // 401: Try token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url?.includes('/api/auth/refresh-token')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                await api.post('/api/auth/refresh-token', {});
                return api(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        // 403: Show upgrade modal if it's a plan limit error
        if (error.response?.status === 403) {
            const message = (
                error.response?.data?.message ||
                error.response?.data?.error ||
                ''
            ).toLowerCase();

            const isPlanError = UPGRADE_KEYWORDS.some((kw) => message.includes(kw));

            if (isPlanError) {
                // Lazy import to avoid circular dependency
                import('../context/PlanContext').then(({ triggerUpgradeModal }) => {
                    triggerUpgradeModal();
                });
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

