import { apiClient } from './client';
import { AttachmentResponse } from '@/types';

export const attachmentsApi = {
  getAttachments: async (taskId: number): Promise<AttachmentResponse[]> => {
    const response = await apiClient.get<AttachmentResponse[]>(`/tasks/${taskId}/attachments`);
    return response.data;
  },

  uploadAttachment: async (
    taskId: number,
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<AttachmentResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<AttachmentResponse>(
      `/tasks/${taskId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': undefined, // Let the browser set multipart/form-data boundary
        },
        onUploadProgress,
      }
    );
    return response.data;
  },

  downloadAttachment: async (
    taskId: number,
    attachmentId: number,
    filename: string
  ): Promise<void> => {
    const response = await apiClient.get(
      `/tasks/${taskId}/attachments/${attachmentId}`,
      {
        responseType: 'blob',
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteAttachment: async (taskId: number, attachmentId: number): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  },
};
