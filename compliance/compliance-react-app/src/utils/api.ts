const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getAuthToken = (): string | null => localStorage.getItem('authToken');

export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const API_ENDPOINTS = {
  LOGIN:  '/auth/login',
  LOGOUT: '/auth/logout',
  ME:     '/auth/me',
};

export { API_BASE_URL };
