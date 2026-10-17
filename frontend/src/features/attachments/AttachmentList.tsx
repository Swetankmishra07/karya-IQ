import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { attachmentsApi } from '@/api/attachments';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDateTime, formatFileSize } from '@/utils/formatters';
import { AttachmentResponse } from '@/types';

interface AttachmentListProps {
  taskId: number;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ taskId }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState<AttachmentResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => attachmentsApi.getAttachments(taskId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      attachmentsApi.uploadAttachment(taskId, file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', taskId] });
      setUploadProgress(null);
      success('Attachment uploaded', data.original_filename);
    },
    onError: (err: any) => {
      setUploadProgress(null);
      const detail = err.response?.data?.detail || 'Upload failed';
      toastError('Upload Failed', typeof detail === 'string' ? detail : 'File upload failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: number) => attachmentsApi.deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', taskId] });
      setDeletingAttachment(null);
      success('Attachment deleted');
    },
    onError: (err: any) => {
      toastError('Delete Failed', err.response?.data?.detail || 'Could not delete attachment');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDownload = async (attachment: AttachmentResponse) => {
    try {
      await attachmentsApi.downloadAttachment(taskId, attachment.id, attachment.original_filename);
    } catch {
      toastError('Download Failed', 'Could not download the file.');
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />;
    if (contentType.includes('pdf') || contentType.includes('document'))
      return <FileText className="w-5 h-5 text-rose-500" />;
    if (contentType.includes('sheet') || contentType.includes('csv'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('compressed'))
      return <FileArchive className="w-5 h-5 text-amber-500" />;
    if (contentType.includes('json') || contentType.includes('javascript') || contentType.includes('python'))
      return <FileCode className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-[#1868DB] bg-blue-50/50'
            : 'border-[#DFE1E6] bg-[#FAFBFC] hover:bg-[#F4F5F7] hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-[#1868DB] animate-spin" />
            <p className="text-xs font-semibold text-[#172B4D]">
              Uploading... {uploadProgress !== null ? `${uploadProgress}%` : ''}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[#1868DB]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#172B4D]">
              Click to upload or drag and drop
            </p>
            <p className="text-[11px] text-[#6B778C]">
              Supports documents, images, and archives up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Attachments List */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B778C]">
          Attached Files ({attachments.length})
        </h4>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">No attachments on this task.</p>
        ) : (
          attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 bg-white border border-[#DFE1E6] rounded-md hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="flex-shrink-0">{getFileIcon(file.content_type)}</div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#172B4D] truncate" title={file.original_filename}>
                    {file.original_filename}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-[#6B778C]">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>{formatDateTime(file.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(file)}
                  title="Download file"
                  className="p-1.5 h-auto"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </Button>

                {(user?.id === file.uploader_id || user?.role === 'admin' || user?.role === 'manager') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingAttachment(file)}
                    title="Delete file"
                    className="p-1.5 h-auto hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingAttachment !== null}
        onClose={() => setDeletingAttachment(null)}
        onConfirm={() => {
          if (deletingAttachment) deleteMutation.mutate(deletingAttachment.id);
        }}
        title="Delete Attachment"
        message={`Are you sure you want to delete "${deletingAttachment?.original_filename}"?`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
