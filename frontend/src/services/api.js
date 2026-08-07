import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            const isAuthUrl = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token');
            if (isAuthUrl) {
                return Promise.reject(error);
            }

            const { tokens, setTokens, logout } = useAuthStore.getState();
            const refreshToken = tokens?.refreshToken;

            if (!refreshToken) {
                logout();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });
                const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;

                if (newAccessToken) {
                    const updatedTokens = { ...tokens, accessToken: newAccessToken };
                    setTokens(updatedTokens);
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    processQueue(null, newAccessToken);
                    return api(originalRequest);
                } else {
                    throw new Error('No access token returned from refresh');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);