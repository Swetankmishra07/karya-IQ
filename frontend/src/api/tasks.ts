import { apiClient } from './client';
import { TaskCreate, TaskQueryParams, TaskResponse, TaskUpdate } from '@/types';

export const tasksApi = {
  getTasks: async (params?: TaskQueryParams): Promise<TaskResponse[]> => {
    const response = await apiClient.get<TaskResponse[]>('/tasks', { params });
    return response.data;
  },

  getTask: async (id: number): Promise<TaskResponse> => {
    const response = await apiClient.get<TaskResponse>(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: TaskCreate): Promise<TaskResponse> => {
    const response = await apiClient.post<TaskResponse>('/tasks', data);
    return response.data;
  },

  updateTask: async (id: number, data: TaskUpdate): Promise<TaskResponse> => {
    const response = await apiClient.put<TaskResponse>(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
