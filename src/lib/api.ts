import { buildApiUrl as buildUrl, API_CONFIG } from '../config/api.config';

export const getApiUrl = (): string => {
  return API_CONFIG.BASE_URL;
};
export const buildApiUrl = (endpoint: string): string => {
  return buildUrl(endpoint);
};
export const buildQueryString = (params: Record<string, any>): string => {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return filtered ? `?${filtered}` : '';
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};