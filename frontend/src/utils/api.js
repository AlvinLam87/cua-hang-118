export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_V1_URL}${cleanPath}`;
};
