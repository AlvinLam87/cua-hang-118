import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEYS = ['userToken', 'userData', 'authServerOrigin'];

let onSessionExpired = null;
let onLoginSuccess = null;
let clearingSession = false;

export function setOnSessionExpired(handler) {
  onSessionExpired = handler;
}

export function setOnLoginSuccess(handler) {
  onLoginSuccess = handler;
}

export async function clearAuthSession() {
  if (clearingSession) return;
  clearingSession = true;
  try {
    await AsyncStorage.multiRemove(AUTH_KEYS);
    onSessionExpired?.();
  } finally {
    clearingSession = false;
  }
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

/** Token cũ hoặc đăng nhập server khác → cần đăng nhập lại */
export async function shouldClearStoredAuth() {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) return false;

  const { getServerOrigin } = require('./config');
  const saved = await AsyncStorage.getItem('authServerOrigin');
  if (!saved) return true;
  return saved !== getServerOrigin();
}
