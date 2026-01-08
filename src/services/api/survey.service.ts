import { apiClient } from './base.client';
import { API_ENDPOINTS } from '../../config/api.config';

export interface SurveyCreate {
  age: string;
  trust_traditional: number;
  blockchain_familiarity: number;
  retirement_concern: number;
  has_retirement_plan: number;
  values_in_retirement: number;
  interested_in_blockchain: number;
}

export interface SurveyResponse extends SurveyCreate {
  id: number;
  created_at: string;
}

export interface FollowUpCreate {
  wants_more_info: boolean;
  email?: string;
}

export interface FollowUpResponse extends FollowUpCreate {
  id: number;
  created_at: string;
}

export interface SurveyStats {
  total_responses: number;
  averages: Record<string, number>;
  age_distribution: Record<string, number>;
  interest_level: {
    high_interest: number;
    moderate_interest: number;
    low_interest: number;
  };
}

export interface InterestedEmail {
  email: string;
  created_at: string;
}

export interface EmailsResponse {
  total: number;
  emails: InterestedEmail[];
}

export const surveyService = {
  async createSurvey(data: SurveyCreate): Promise<SurveyResponse> {
    return apiClient.post<SurveyResponse>(
      API_ENDPOINTS.SURVEYS.BASE,
      data
    );
  },
  async getSurveys(
    limit: number = 100,
    offset: number = 0
  ): Promise<SurveyResponse[]> {
    return apiClient.get<SurveyResponse[]>(
      API_ENDPOINTS.SURVEYS.BASE,
      { limit, offset }
    );
  },
  async createFollowUp(data: FollowUpCreate): Promise<FollowUpResponse> {
    return apiClient.post<FollowUpResponse>(
      API_ENDPOINTS.SURVEYS.FOLLOW_UP,
      data
    );
  },
  async getStats(): Promise<SurveyStats> {
    return apiClient.get<SurveyStats>(
      API_ENDPOINTS.SURVEYS.STATS
    );
  },
  async getFollowUps(
    limit: number = 100,
    offset: number = 0
  ): Promise<FollowUpResponse[]> {
    return apiClient.get<FollowUpResponse[]>(
      API_ENDPOINTS.SURVEYS.FOLLOW_UPS,
      { limit, offset }
    );
  },
  async getInterestedEmails(): Promise<EmailsResponse> {
    return apiClient.get<EmailsResponse>(
      API_ENDPOINTS.SURVEYS.EMAILS
    );
  },
};

export default surveyService;