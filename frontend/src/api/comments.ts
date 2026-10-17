import { apiClient } from './client';
import {
  ActivityResponse,
  CommentCreate,
  CommentResponse,
  CommentUpdate,
} from '@/types';

export const commentsApi = {
  getTaskComments: async (taskId: number): Promise<CommentResponse[]> => {
    const response = await apiClient.get<CommentResponse[]>(`/tasks/${taskId}/comments`);
    return response.data;
  },

  createComment: async (taskId: number, data: CommentCreate): Promise<CommentResponse> => {
    const response = await apiClient.post<CommentResponse>(`/tasks/${taskId}/comments`, data);
    return response.data;
  },

  updateComment: async (commentId: number, data: CommentUpdate): Promise<CommentResponse> => {
    const response = await apiClient.patch<CommentResponse>(`/comments/${commentId}`, data);
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },

  getTaskActivity: async (taskId: number): Promise<ActivityResponse[]> => {
    const response = await apiClient.get<ActivityResponse[]>(`/tasks/${taskId}/activity`);
    return response.data;
  },
};
