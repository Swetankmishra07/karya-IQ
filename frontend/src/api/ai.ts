import { apiClient } from './client';
import {
  AIPrioritySuggestionResponse,
  AISummaryResponse,
  AITaskCreateRequest,
  AITaskCreateResponse,
} from '@/types';

export const aiApi = {
  createTaskFromText: async (data: AITaskCreateRequest): Promise<AITaskCreateResponse> => {
    const response = await apiClient.post<AITaskCreateResponse>('/ai/tasks/from-text', data);
    return response.data;
  },

  getTaskSummary: async (taskId: number): Promise<AISummaryResponse> => {
    const response = await apiClient.post<AISummaryResponse>(`/ai/tasks/${taskId}/summary`, {});
    return response.data;
  },

  getPrioritySuggestion: async (taskId: number): Promise<AIPrioritySuggestionResponse> => {
    const response = await apiClient.post<AIPrioritySuggestionResponse>(
      `/ai/tasks/${taskId}/priority-suggestion`,
      {}
    );
    return response.data;
  },
};
