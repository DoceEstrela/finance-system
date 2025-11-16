import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // withCredentials já está configurado, então cookies também serão enviados
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Não usar window.location.href para evitar refresh completo
      // O AuthContext vai tratar o redirect
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getUsers: (params) => api.get('/auth/users', { params }),
  createUser: (data) => api.post('/auth/create-user', data),
  createFirstAdmin: (data) => api.post('/auth/create-first-admin', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (resetToken, password) => api.put(`/auth/reset-password/${resetToken}`, { password }),
  verifyEmail: (verificationToken) => api.get(`/auth/verify-email/${verificationToken}`),
  resendVerificationEmail: (email) => api.post('/auth/resend-verification', { email }),
}

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getProductions: () => api.get('/products/productions'),
}

export const clientService = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  createQuickSale: () => api.post('/clients/quick-sale'),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getPurchases: (id) => api.get(`/clients/${id}/purchases`),
}

export const saleService = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  updatePaymentStatus: (id, data) => api.put(`/sales/${id}/payment`, data),
  getReport: (params) => api.get('/sales/reports/period', { params }),
}

export const materialService = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  getStats: () => api.get('/materials/stats'),
}

export const materialPurchaseService = {
  getAll: (params) => api.get('/material-purchases', { params }),
  create: (data) => api.post('/material-purchases', data),
  getConsumptionReport: (params) => api.get('/material-purchases/consumption-report', { params }),
}

export const materialWithdrawalService = {
  getAll: (params) => api.get('/material-withdrawals', { params }),
  create: (data) => api.post('/material-withdrawals', data),
  getById: (id) => api.get(`/material-withdrawals/${id}`),
  getByProduction: () => api.get('/material-withdrawals/stats/by-production'),
}

export default api
