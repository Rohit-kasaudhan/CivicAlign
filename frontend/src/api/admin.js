import api from './axios';

export const getAdminDashboard = () =>
  api.get('/admin/dashboard').then((r) => r.data);

export const getAdminComplaints = (params) =>
  api.get('/admin/complaints', { params }).then((r) => r.data);

export const updateComplaintStatus = (id, status, note = '', department = '') =>
  api.put(`/admin/complaints/${id}/status`, { status, note, department }).then((r) => r.data);

export const getAdminInitiatives = () =>
  api.get('/admin/initiatives').then((r) => r.data);

export const updateInitiative = (id, data) =>
  api.put(`/admin/initiatives/${id}`, data).then((r) => r.data);

export const getLeaderboard = () =>
  api.get('/admin/leaderboard').then((r) => r.data);

export const reprocessComplaint = (id) =>
  api.post(`/ai/admin/complaints/${id}/reprocess`).then((r) => r.data);
