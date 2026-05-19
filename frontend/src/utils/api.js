const getDynamicApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
      return `http://${hostname}:3001`;
    }
  }
  return envUrl || '';
};

export const API_BASE_URL = getDynamicApiBaseUrl();
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_V1_URL}${cleanPath}`;
};
