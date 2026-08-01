import api from './api';

export const paymentService = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  requestRefund: (data) => api.post('/payments/refund', data),
  getHistory: (params) => api.get('/payments/history', { params }),
  getRefunds: (params) => api.get('/payments/refunds', { params }),
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  downloadInvoice: (id) => api.get(`/invoices/${id}`, { responseType: 'blob' }),
};