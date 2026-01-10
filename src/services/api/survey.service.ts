import { z } from 'zod';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

interface FetchWithRetryOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 60000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log('🌐 API Request:', { url, method: options.method || 'GET' });
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('❌ Request timeout:', url);
      throw new ApiError(
        `Request timeout - Server took longer than ${timeoutMs}ms to respond. Please check if the backend is running.`,
        408
      );
    }
    
    throw error;
  }
}
async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    timeout = 60000,
    retries = 3,
    retryDelay = 2000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt + 1}/${retries + 1}...`);
      const response = await fetchWithTimeout(url, fetchOptions, timeout);
      if (response.ok || response.status < 500) {
        return response;
      }
      throw new ApiError(
        `Server error: ${response.status}`,
        response.status
      );
      
    } catch (error: any) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      if (
        error instanceof ApiError && 
        (error.statusCode === 408 || (error.statusCode && error.statusCode >= 500))
      ) {
        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      throw error;
    }
  }
  throw lastError || new ApiError('All retry attempts failed');
}

async function request<T>(
  endpoint: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }
    return {} as T;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(
      data.detail || data.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }
  return data;
}

export const SurveyCreateSchema = z.object({
  age: z.string(),
  trust_traditional: z.number().min(-2).max(2),
  blockchain_familiarity: z.number().min(-2).max(2),
  retirement_concern: z.number().min(-2).max(2),
  has_retirement_plan: z.number().min(-2).max(2),
  values_in_retirement: z.number().min(-2).max(2),
  interested_in_blockchain: z.number().min(-2).max(2),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export const FollowUpCreateSchema = z.object({
  wants_more_info: z.boolean(),
  email: z.string().email().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export type SurveyCreate = z.infer<typeof SurveyCreateSchema>;
export type FollowUpCreate = z.infer<typeof FollowUpCreateSchema>;
export interface SurveyResponse {
  id: number;
  age: string;
  trust_traditional: number;
  blockchain_familiarity: number;
  retirement_concern: number;
  has_retirement_plan: number;
  values_in_retirement: number;
  interested_in_blockchain: number;
  created_at: string;
}

export interface FollowUpResponse {
  id: number;
  wants_more_info: boolean;
  email?: string;
  created_at: string;
}

export const surveyService = {
  async createSurvey(data: SurveyCreate): Promise<SurveyResponse> {
    console.log('📊 Creating survey...', data);
    const validated = SurveyCreateSchema.parse(data);
    return request<SurveyResponse>('/api/v1/surveys/', {
      method: 'POST',
      body: JSON.stringify(validated),
      timeout: 60000, 
      retries: 3, 
      retryDelay: 2000, 
    });
  },

  async createFollowUp(data: FollowUpCreate): Promise<FollowUpResponse> {
    console.log('📧 Creating follow-up...', data);
    const validated = FollowUpCreateSchema.parse(data);
    return request<FollowUpResponse>('/api/v1/surveys/follow-up', {
      method: 'POST',
      body: JSON.stringify(validated),
      timeout: 60000,
      retries: 3,
      retryDelay: 2000,
    });
  },

  async getSurveys(limit = 100, offset = 0): Promise<SurveyResponse[]> {
    return request<SurveyResponse[]>(
      `/api/v1/surveys/?limit=${limit}&offset=${offset}`,
      { timeout: 30000 } 
    );
  },
};

export async function wakeUpBackend(): Promise<boolean> {
  try {
    console.log('☕ Waking up backend...');
    
    await fetchWithTimeout(`${API_URL}/health`, {
      method: 'GET',
    }, 60000);
    
    console.log('✅ Backend is awake!');
    return true;
  } catch (error) {
    console.error('❌ Failed to wake up backend:', error);
    return false;
  }
}

export interface ContactCreate {
  name: string;
  email: string;
  subject: string;
  message: string;
  walletAddress?: string;
}

export const contactService = {
  async submitContact(data: ContactCreate): Promise<any> {
    return request('/api/v1/contact/', {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: 30000,
      retries: 2,
    });
  },
};