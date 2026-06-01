import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEYS = ['userToken', 'userData', 'authServerOrigin'];

let onSessionExpired = null;
let onLoginSuccess = null;

export function setOnSessionExpired(handler) {
  onSessionExpired = handler;
}

export function setOnLoginSuccess(handler) {
  onLoginSuccess = handler;
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove(AUTH_KEYS);
  onSessionExpired?.();
}

export async function saveAuthSession(token, user) {
  const { getServerOrigin } = require('./config');
  await AsyncStorage.multiSet([
    ['userToken', token],
    ['userData', JSON.stringify(user)],
    ['authServerOrigin', getServerOrigin()],
  ]);
  onLoginSuccess?.(token);
}

/** Token lưu từ server khác (local vs Render) → không dùng được */
export async function isAuthServerMismatch() {
  const { getServerOrigin } = require('./config');
  const saved = await AsyncStorage.getItem('authServerOrigin');
  if (!saved) return false;
  return saved !== getServerOrigin();
}
