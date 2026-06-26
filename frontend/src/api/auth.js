import api from './axios';

export const loginUser = (credentials) =>
  api.post('/auth/login', credentials).then((r) => r.data);

export const adminLoginUser = (credentials) =>
  api.post('/auth/admin/login', credentials).then((r) => r.data);

export const registerUser = (userData) =>
  api.post('/auth/register', userData).then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const updateLanguage = (language) =>
  api.put('/auth/language', { language }).then((r) => r.data);

export const googleAuth = (accessToken) =>
  api.post('/auth/google', { access_token: accessToken }).then((r) => r.data);

export const updateProfile = (data) =>
  api.put('/auth/profile', data).then((r) => r.data);

export const getMyStats = () =>
  api.get('/auth/stats').then((r) => r.data);

export const getMyBadges = () =>
  api.get('/auth/badges').then((r) => r.data);

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (email, otp, newPassword) =>
  api.post('/auth/reset-password', { email, otp, new_password: newPassword }).then((r) => r.data);
