import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3001/api/v1';
  
  // Nếu là máy ảo (Emulator), bắt buộc dùng 10.0.2.2 để không bị vướng tường lửa Windows
  if (!Constants.isDevice && Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api/v1';
  }
  
  // Nếu là điện thoại thật, lấy IP tĩnh của máy tính phát WiFi từ Expo
  const debuggerHost = Constants.expoConfig?.hostUri;
  let pcIp = '172.20.10.5'; // Fallback tĩnh (IP của máy tính)
  
  if (debuggerHost) {
    pcIp = debuggerHost.split(':')[0];
  }
  
  return `http://${pcIp}:3001/api/v1`;
};

const API_URL = getBaseUrl();

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

export const API_URL_BASE = getBaseUrl().replace('/api/v1', ''); // Used for image prefixes

export const technicianAPI = {
  getTasks:     ()          => api.get('/technician/tasks'),
  updateRepair: (id, data)  => api.put(`/technician/repairs/${id}`, data),
  nextStep:     (id)        => api.patch(`/technician/repairs/${id}/next-step`),
  uploadImage:  (id, formData) => api.post(`/technician/repairs/${id}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;
