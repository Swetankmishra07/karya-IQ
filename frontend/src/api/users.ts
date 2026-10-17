import { apiClient } from './client';
import { RoleUpdate, UserResponse, UserRole } from '@/types';

export const usersApi = {
  getUsers: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>('/users');
    return response.data;
  },

  changeUserRole: async (userId: number, role: UserRole): Promise<UserResponse> => {
    const payload: RoleUpdate = { role };
    const response = await apiClient.patch<UserResponse>(`/users/${userId}/role`, payload);
    return response.data;
  },
};
