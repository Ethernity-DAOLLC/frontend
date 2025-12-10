export const getApiUrl = (): string => {
  if (import.meta.env.DEV) {
    return '/api';
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    console.error('VITE_API_URL is not defined in production');
    return 'http://localhost:4000';
  }
  
  return apiUrl;
};

export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};