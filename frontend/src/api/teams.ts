import { apiClient } from './client';
import {
  TeamCreate,
  TeamMemberCreate,
  TeamMemberResponse,
  TeamResponse,
  TeamUpdate,
} from '@/types';

export const teamsApi = {
  getTeams: async (): Promise<TeamResponse[]> => {
    const response = await apiClient.get<TeamResponse[]>('/teams');
    return response.data;
  },

  getTeam: async (id: number): Promise<TeamResponse> => {
    const response = await apiClient.get<TeamResponse>(`/teams/${id}`);
    return response.data;
  },

  createTeam: async (data: TeamCreate): Promise<TeamResponse> => {
    const response = await apiClient.post<TeamResponse>('/teams', data);
    return response.data;
  },

  updateTeam: async (id: number, data: TeamUpdate): Promise<TeamResponse> => {
    const response = await apiClient.patch<TeamResponse>(`/teams/${id}`, data);
    return response.data;
  },

  deleteTeam: async (id: number): Promise<void> => {
    await apiClient.delete(`/teams/${id}`);
  },

  getTeamMembers: async (id: number): Promise<TeamMemberResponse[]> => {
    const response = await apiClient.get<TeamMemberResponse[]>(`/teams/${id}/members`);
    return response.data;
  },

  addTeamMember: async (id: number, data: TeamMemberCreate): Promise<TeamMemberResponse> => {
    const response = await apiClient.post<TeamMemberResponse>(`/teams/${id}/members`, data);
    return response.data;
  },

  removeTeamMember: async (id: number, userId: number): Promise<void> => {
    await apiClient.delete(`/teams/${id}/members/${userId}`);
  },
};
