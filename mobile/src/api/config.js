import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * true  → server online (Render)
 * false → backend chạy trên máy tính (LAN / emulator)
 */
export const IS_PRODUCTION = false;

const getLanIp = () => {
  let pcIp = '192.168.1.89';

  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.expoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGoProjectConfigs?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip) pcIp = ip;
  }

  return pcIp;
};

/** Base URL không có /api/v1 — dùng cho Socket.io và ảnh upload */
export const getServerOrigin = () => {
  if (IS_PRODUCTION) {
    return 'https://cua-hang-118.onrender.com';
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

  if (!Constants.isDevice && Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return `http://${getLanIp()}:3001`;
};

export const getApiBaseUrl = () => `${getServerOrigin()}/api/v1`;

/** Alias giữ tương thích — tránh lỗi "getBaseUrl doesn't exist" khi cache bundle cũ */
export const getBaseUrl = getApiBaseUrl;
