import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getRefunds: (params) => api.get('/admin/refunds', { params }),
  approveRefund: (id, data) => api.put(`/admin/refunds/${id}/approve`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getLogs: (params) => api.get('/admin/logs', { params }),
};