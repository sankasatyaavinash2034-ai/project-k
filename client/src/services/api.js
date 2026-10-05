export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const getStoredToken = () => {
  return localStorage.getItem('aarohan_token') || '';
};

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('aarohan_token', token);
  } else {
    localStorage.removeItem('aarohan_token');
  }
};

/**
 * Universal fetch wrapper that seamlessly includes Bearer token headers & credentials
 */
export const apiFetch = async (url, options = {}) => {
  const token = getStoredToken();
  const headers = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
};
