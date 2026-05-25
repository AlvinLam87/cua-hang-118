import { io } from 'socket.io-client';
import { API_BASE_URL } from './api.js';

export const getSocketUrl = () => {
  const envUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    if (import.meta.env.DEV) {
      return window.location.origin;
    }
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
      return `http://${hostname}:3001`;
    }
  }
  return envUrl || API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
};

export const createAppSocket = () =>
  io(getSocketUrl(), {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 20000,
  });
