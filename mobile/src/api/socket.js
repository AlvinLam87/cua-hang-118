import { io } from 'socket.io-client';
import { getServerOrigin } from './config';

const SOCKET_URL = getServerOrigin();

let socket;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.io server:', socket.id, SOCKET_URL);
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
