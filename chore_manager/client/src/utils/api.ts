// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// API request helper with auth headers
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized - clear token and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('choreapp_user');
      window.location.reload();
      throw new Error('Unauthorized');
    }

    // Parse JSON response
    const data = await response.json();

    // Handle non-2xx responses
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/change-password',

  // Chores
  CHORES: '/chores',
  CHORE_BY_ID: (id: string) => `/chores/${id}`,
  CHORE_STATUS: (id: string) => `/chores/${id}/status`,
  CHORE_STATS: '/chores/stats/summary',

  // Team
  TEAM: '/team',
  TEAM_MEMBER: (id: string) => `/team/${id}`,
  TEAM_MEMBER_CHORES: (id: string) => `/team/${id}/chores`,
  TEAM_WORKLOAD: '/team/stats/workload',

  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
};

export { API_BASE_URL };
