import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the base URL without the /api/v1 path
const getSocketUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3001';
  
  // If it's an Android emulator, use 10.0.2.2
  if (!Constants.isDevice && Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }
  
  // If it's a real device, get the IP from Expo
  const debuggerHost = Constants.expoConfig?.hostUri;
  let pcIp = '172.20.10.5'; // Static fallback (IP của máy tính)
  
  if (debuggerHost) {
    pcIp = debuggerHost.split(':')[0];
  }
  
  return `http://${pcIp}:3001`;
};

const SOCKET_URL = getSocketUrl();

let socket;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'], // Use WebSocket transport for better performance
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.io server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io server');
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized yet. Call initSocket() first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
