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
        // Clear the promise so subsequent requests will retry instead of reusing a failed result.
        csrfTokenPromise = null;
        return null;
    }
};

// Kick off the fetch immediately — reuse the same promise to avoid duplicate requests.
csrfTokenPromise = fetchCsrfToken();

api.interceptors.request.use(async (config) => {
    // Guard against undefined method (defaults to 'get')
    const method = (config.method || 'get').toLowerCase();
    
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
        if (!csrfToken) {
            // If the eager fetch failed (csrfTokenPromise is null), trigger a fresh fetch.
            if (!csrfTokenPromise) {
                csrfTokenPromise = fetchCsrfToken();
            }
            csrfToken = await csrfTokenPromise;
        }
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
    }
    return config;
}, (error) => Promise.reject(error));

import toast from 'react-hot-toast';

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
                toast.error("Session expired. Please log in again.");
                return Promise.reject(refreshError);
            }
        }

        // 403: Show upgrade modal if it's a plan limit error, else show generic deny
        if (error.response?.status === 403) {
            const message = (
                error.response?.data?.message || error.response?.data?.error ||
                'Access denied. You do not have permission for this action.'
            );

            const isPlanError = UPGRADE_KEYWORDS.some((kw) => message.toLowerCase().includes(kw));

            if (isPlanError) {
                toast.error("Plan limit reached. Please upgrade to continue.");
                if (window.location.pathname !== '/pricing') {
                    window.location.assign('/pricing');
                }
                return Promise.reject(error);
            } else {
                toast.error(message);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

