import api from './axios';

export const getCommunityFeed = () =>
  api.get('/community/feed').then((r) => r.data);

export const getInitiatives = () =>
  api.get('/community/initiatives').then((r) => r.data);

export const verifyComplaint = (complaint_id, note = '') =>
  api.post('/community/verify', { complaint_id, note }).then((r) => r.data);

export const supportComplaint = (complaint_id, note = '') =>
  api.post('/community/support', { complaint_id, note }).then((r) => r.data);
