import { API_BASE_URL } from './api.js';

export const resolveMediaUrl = (rawUrl) => {
  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  if (!rawUrl.startsWith('/')) {
    return API_BASE_URL ? `${API_BASE_URL}/${rawUrl}` : `/${rawUrl}`;
  }

  return API_BASE_URL ? `${API_BASE_URL}${rawUrl}` : rawUrl;
};

export const normalizeProductImages = (rawValue) => {
  if (!rawValue) return [];

  let candidates = [];

  if (Array.isArray(rawValue)) {
    candidates = rawValue;
  } else if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        candidates = Array.isArray(parsed) ? parsed : [trimmed];
      } catch {
        candidates = [trimmed];
      }
    } else if (trimmed.includes(',')) {
      candidates = trimmed.split(',').map((item) => item.trim());
    } else {
      candidates = [trimmed];
    }
  } else {
    candidates = [String(rawValue)];
  }

  return [...new Set(candidates.map(resolveMediaUrl).filter(Boolean))];
};
