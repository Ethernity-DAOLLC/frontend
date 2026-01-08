import { buildApiUrl, API_CONFIG, DEFAULT_HEADERS } from '../../config/api.config';
import { ApiError } from '../../lib/api';

interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  timeout?: number;
}
export class BaseApiClient {
  private authToken: string | null = null;
  setAuthToken(token: string | null) {
    this.authToken = token;
  }
  getAuthToken(): string | null {
    return this.authToken;
  }
  private buildHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      ...DEFAULT_HEADERS,
      ...customHeaders,
    };
    if (this.authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }
  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';
    const filtered = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return filtered ? `?${filtered}` : '';
  }
  private async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number = API_CONFIG.TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw error;
    }
  }
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, timeout, ...fetchConfig } = config;
    const url = buildApiUrl(endpoint) + this.buildQueryString(params);
    const headers = this.buildHeaders(config.headers);
    try {
      const response = await this.fetchWithTimeout(
        url,
        { ...fetchConfig, headers },
        timeout
      );
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: response.statusText };
        }
        throw new ApiError(
          errorData.detail || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }
      if (response.status === 204) {
        return null as T;
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Network error:', error);
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        error
      );
    }
  }
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    config?: Omit<RequestConfig, 'params'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
      params,
    });
  }
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async delete<T = any>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }
}
export const apiClient = new BaseApiClient();