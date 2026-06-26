import api from './axios';

export const getComplaints = (params) =>
  api.get('/complaints', { params }).then((r) => r.data);

export const getMyComplaints = () =>
  api.get('/complaints/my').then((r) => r.data);

export const getFeed = (params) =>
  api.get('/complaints/feed', { params }).then((r) => r.data);

export const getMapData = () =>
  api.get('/complaints/map').then((r) => r.data);

export const getComplaint = (id) =>
  api.get(`/complaints/${id}`).then((r) => r.data);

export const createComplaint = (formData) =>
  api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const updateComplaintStatus = (id, status, note = '') =>
  api.put(`/complaints/${id}`, { status, note }).then((r) => r.data);
