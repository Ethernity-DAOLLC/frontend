export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://backend-m6vc.onrender.com',
  VERSION: 'v1',
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}/${cleanEndpoint}`;
};
export const API_ENDPOINTS = {
  SURVEYS: {
    BASE: '/survey/surveys',
    FOLLOW_UP: '/survey/surveys/follow-up',
    STATS: '/survey/surveys/stats',
    EMAILS: '/survey/surveys/emails',
    FOLLOW_UPS: '/survey/surveys/follow-ups',
  },
  USERS: {
    BASE: '/users',
    EMAIL: '/users/email',
    REGISTER: '/users/register',
    WALLET: (address: string) => `/users/wallet/${address}`,
    LOGIN: (address: string) => `/users/login/${address}`,
    MAILING_LIST: '/users/mailing-list',
    SEARCH: '/users/search',
    BY_ID: (id: number) => `/users/${id}`,
  },
  CONTACT: {
    BASE: '/contact',
    MESSAGES: '/contact/messages',
    MESSAGE: (id: number) => `/contact/messages/${id}`,
    MARK_READ: (id: number) => `/contact/messages/${id}/read`,
    REPLY: (id: number) => `/contact/messages/${id}/reply`,
    STATS: '/contact/stats',
  },
  AUTH: {
    ADMIN_LOGIN: '/auth/admin/login',
  },
  STATS: {
    ADMIN: '/stats/admin/stats',
  },
} as const;
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
if (isDevelopment) {
  console.log('🔧 API Configuration:', {
    baseUrl: API_CONFIG.BASE_URL,
    version: API_CONFIG.VERSION,
    environment: isDevelopment ? 'development' : 'production',
  });
}