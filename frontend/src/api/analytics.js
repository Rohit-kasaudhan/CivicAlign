import api from './axios';

const clean = (params = {}) => {
  const p = {};
  if (params.start_date) p.start_date = params.start_date;
  if (params.end_date)   p.end_date   = params.end_date;
  return p;
};

export const getAnalyticsOverview   = (p) => api.get('/analytics/overview',              { params: clean(p) }).then(r => r.data);
export const getByCategory          = (p) => api.get('/analytics/by-category',           { params: clean(p) }).then(r => r.data);
export const getMonthlyTrend        = (p) => api.get('/analytics/monthly-trend',         { params: clean(p) }).then(r => r.data);
export const getByStatus            = (p) => api.get('/analytics/by-status',             { params: clean(p) }).then(r => r.data);
export const getByPriority          = (p) => api.get('/analytics/by-priority',           { params: clean(p) }).then(r => r.data);
export const getByCity              = (p) => api.get('/analytics/by-city',               { params: clean(p) }).then(r => r.data);
export const getDeptPerformance     = (p) => api.get('/analytics/department-performance', { params: clean(p) }).then(r => r.data);
