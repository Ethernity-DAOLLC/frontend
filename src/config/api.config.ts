const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('  Base URL:', API_BASE_URL);
  console.log('  Mode:', import.meta.env.MODE);
}

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, 
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const cleanBaseUrl = API_CONFIG.BASE_URL.endsWith('/') 
    ? API_CONFIG.BASE_URL.slice(0, -1) 
    : API_CONFIG.BASE_URL;
  return `${cleanBaseUrl}/api/v1/${cleanEndpoint}`;
};
export const API_ENDPOINTS = {
  AUTH: {
    ADMIN_LOGIN: '/auth/admin/login',
  },
  SURVEYS: {
    BASE: '/surveys',
    FOLLOW_UP: '/surveys/follow-up',
    STATS: '/surveys/stats',
    FOLLOW_UPS: '/surveys/follow-ups',
    EMAILS: '/surveys/emails',
  },
  CONTACT: {
    BASE: '/contact',
    MESSAGES: '/contact/messages',
    MESSAGE: (id: number) => `/contact/messages/${id}`,
    MARK_READ: (id: number) => `/contact/messages/${id}/read`,
    REPLY: (id: number) => `/contact/messages/${id}/reply`,
    STATS: '/contact/stats',
  },
  USERS: {
    BASE: '/users',
    REGISTER: '/users/register',
    EMAIL: '/users/email',
    WALLET: (address: string) => `/users/wallet/${address}`,
    LOGIN: (address: string) => `/users/${address}/login`,
    MAILING_LIST: '/users/mailing-list',
    SEARCH: '/users/search',
    BY_ID: (id: number) => `/users/${id}`,
  },
  STATS: {
    ADMIN: '/admin/stats',
  },
} as const;

export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      console.log('✅ API connection successful');
      return true;
    } else {
      console.warn('⚠️ API responded but with error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to API:', error);
    console.error('   Make sure backend is running at:', API_CONFIG.BASE_URL);
    return false;
  }
};
if (import.meta.env.DEV) {
  testApiConnection();
}