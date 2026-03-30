import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.ub.bitbros.in';
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:4000/api/proxy';
const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY || '';
const API_PREFIX = '/api';

const getStoredAccessToken = () => localStorage.getItem('token');
const getStoredRefreshToken = () => localStorage.getItem('refreshToken');

const storeTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    localStorage.setItem('token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// API client for public API routes (pk_live key)
const publicApi = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'x-api-key': PUBLIC_KEY,
  },
});

// Proxy client (optional) for storage-only operations with sk_live on local server
const storageProxyApi = axios.create({
  baseURL: PROXY_URL,
});

const requestAuthInterceptor = (config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

[publicApi, storageProxyApi].forEach((api) => {
  api.interceptors.request.use((config) => {
    if (!config.headers['x-api-key']) {
      config.headers['x-api-key'] = PUBLIC_KEY;
    }
    return requestAuthInterceptor(config);
  });
});

const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(
    `${API_BASE_URL}${API_PREFIX}/userAuth/refresh-token`,
    {},
    {
      headers: {
        'x-api-key': PUBLIC_KEY,
        'x-refresh-token': refreshToken,
        'x-refresh-token-mode': 'header',
      },
    }
  );

  const nextAccessToken = response.data?.accessToken || response.data?.token;
  const nextRefreshToken = response.data?.refreshToken || refreshToken;
  if (!nextAccessToken) {
    throw new Error('Refresh did not return access token');
  }

  storeTokens({ accessToken: nextAccessToken, refreshToken: nextRefreshToken });
  return nextAccessToken;
};

publicApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return publicApi(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: async (data) => {
    const response = await publicApi.post('/userAuth/signup', data, {
      headers: { 'x-refresh-token-mode': 'header' },
    });
    storeTokens({
      accessToken: response.data?.accessToken || response.data?.token,
      refreshToken: response.data?.refreshToken,
    });
    return response;
  },
  login: async (data) => {
    const response = await publicApi.post('/userAuth/login', data, {
      headers: { 'x-refresh-token-mode': 'header' },
    });
    storeTokens({
      accessToken: response.data?.accessToken || response.data?.token,
      refreshToken: response.data?.refreshToken,
    });
    return response;
  },
  getMe: () => publicApi.get('/userAuth/me'),
  getPublicProfile: (username) => publicApi.get(`/userAuth/public/${encodeURIComponent(username)}`),
  updateProfile: (data) => publicApi.put('/userAuth/update-profile', data),
  changePassword: (data) => publicApi.put('/userAuth/change-password', data),
  logout: async () => {
    const refreshToken = getStoredRefreshToken();
    const response = await publicApi.post(
      '/userAuth/logout',
      {},
      {
        headers: {
          ...(refreshToken ? { 'x-refresh-token': refreshToken, 'x-refresh-token-mode': 'header' } : {}),
        },
      }
    );
    clearAuthStorage();
    return response;
  },
};

// Data API
export const dataApi = {
  // Posts
  createPost: (data) => publicApi.post('/data/posts', data),
  getPosts: (params) => publicApi.get('/data/posts', { params }),
  getPost: (id) => publicApi.get(`/data/posts/${id}`),
  updatePost: (id, data) => publicApi.put(`/data/posts/${id}`, data),
  deletePost: (id) => publicApi.delete(`/data/posts/${id}`),

  // Comments
  createComment: (data) => publicApi.post('/data/comments', data),
  getComments: (params) => publicApi.get('/data/comments', { params }),
  deleteComment: (id) => publicApi.delete(`/data/comments/${id}`),

  // Likes
  createLike: (data) => publicApi.post('/data/likes', data),
  getLikes: (params) => publicApi.get('/data/likes', { params }),
  deleteLike: (id) => publicApi.delete(`/data/likes/${id}`),

  // Follows
  createFollow: (data) => publicApi.post('/data/follows', data),
  getFollows: (params) => publicApi.get('/data/follows', { params }),
  deleteFollow: (id) => publicApi.delete(`/data/follows/${id}`),

  // Profiles (public collection, replaces blocked /data/users)
  createProfile: (data) => publicApi.post('/data/profiles', data),
  getProfiles: (params) => publicApi.get('/data/profiles', { params }),
  updateProfileDoc: (id, data) => publicApi.put(`/data/profiles/${id}`, data),

  // Notifications
  getNotifications: (params) => publicApi.get('/data/notifications', { params }),
  updateNotification: (id, data) => publicApi.put(`/data/notifications/${id}`, data),
  syncProfileFromUser: async (userData) => {
    if (!userData?._id || !userData?.username) {
      return null;
    }

    const profilePayload = {
      userId: userData._id,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      bio: userData.bio || '',
      avatar: userData.avatar || '',
      banner: userData.banner || '',
      verified: !!userData.verified,
      location: userData.location || '',
      website: userData.website || '',
      followersCount: Number(userData.followersCount || 0),
      followingCount: Number(userData.followingCount || 0),
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existing = await publicApi.get('/data/profiles', {
      params: { userId: userData._id, limit: 1 },
    });
    const existingProfile = Array.isArray(existing.data)
      ? existing.data[0]
      : existing.data?.data?.[0];

    if (existingProfile?._id) {
      return publicApi.put(`/data/profiles/${existingProfile._id}`, profilePayload);
    }
    return publicApi.post('/data/profiles', profilePayload);
  },
};

// Storage API
export const storageApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return storageProxyApi.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (path) => storageProxyApi.delete('/storage/file', { data: { path } }),
};

export { publicApi, storageProxyApi };
