import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),

  // FIX: Send the stored refreshToken in the request body.
  // The backend /api/auth/refresh endpoint now accepts the token from
  // req.body.refreshToken as a fallback when the HttpOnly cookie is
  // blocked (cross-origin Vercel <-> Render deployments with modern browsers).
  refresh: () =>
    api.post('/auth/refresh', {
      refreshToken: localStorage.getItem('refreshToken') || undefined,
    }),

  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) =>
    api.post(`/auth/reset-password/${token}`, { password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: (formData) =>
    api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};