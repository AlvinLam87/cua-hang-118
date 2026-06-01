import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, getServerOrigin } from './config';

const API_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const API_URL_BASE = getServerOrigin(); // Used for image prefixes

export const technicianAPI = {
  getTasks:      ()             => api.get('/technician/tasks'),
  updateBooking: (id, data)     => api.patch(`/technician/bookings/${id}`, data),
  updateRepair:  (id, data)     => api.put(`/technician/repairs/${id}`, data),
  nextStep:      (id)           => api.patch(`/technician/repairs/${id}/next-step`),
  uploadImage:   (id, formData) => api.post(`/technician/repairs/${id}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  searchByPhone: (phone)        => api.get(`/technician/search?phone=${encodeURIComponent(phone)}`),
  createWarrantyOrder: (parentId) => api.post('/technician/repairs/warranty', { parent_id: parentId }),
};

export default api;
