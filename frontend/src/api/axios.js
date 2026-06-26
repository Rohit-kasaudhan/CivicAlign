import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const isAdminPath = window.location.pathname.startsWith('/admin');
    const tokenKey = isAdminPath ? 'civicalign_admin_token' : 'civicalign_citizen_token';
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/');
      if (!isAuthRoute) {
        const isAdminPath = window.location.pathname.startsWith('/admin');
        const tokenKey = isAdminPath ? 'civicalign_admin_token' : 'civicalign_citizen_token';
        localStorage.removeItem(tokenKey);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
