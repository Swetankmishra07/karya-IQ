import { apiClient } from './client';
import {
  ProjectCreate,
  ProjectMemberCreate,
  ProjectMemberResponse,
  ProjectResponse,
  ProjectUpdate,
} from '@/types';

export const projectsApi = {
  getProjects: async (): Promise<ProjectResponse[]> => {
    const response = await apiClient.get<ProjectResponse[]>('/projects');
    return response.data;
  },

  getProject: async (id: number): Promise<ProjectResponse> => {
    const response = await apiClient.get<ProjectResponse>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: ProjectCreate): Promise<ProjectResponse> => {
    const response = await apiClient.post<ProjectResponse>('/projects', data);
    return response.data;
  },

  updateProject: async (id: number, data: ProjectUpdate): Promise<ProjectResponse> => {
    const response = await apiClient.patch<ProjectResponse>(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  getProjectMembers: async (id: number): Promise<ProjectMemberResponse[]> => {
    const response = await apiClient.get<ProjectMemberResponse[]>(`/projects/${id}/members`);
    return response.data;
  },

  addProjectMember: async (id: number, data: ProjectMemberCreate): Promise<ProjectMemberResponse> => {
    const response = await apiClient.post<ProjectMemberResponse>(`/projects/${id}/members`, data);
    return response.data;
  },

  removeProjectMember: async (id: number, userId: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}/members/${userId}`);
  },
};
