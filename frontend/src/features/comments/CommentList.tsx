import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, MessageSquare, Send, Trash2 } from 'lucide-react';
import { commentsApi } from '@/api/comments';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatRelativeTime } from '@/utils/formatters';
import { CommentResponse } from '@/types';

interface CommentListProps {
  taskId: number;
}

export const CommentList: React.FC<CommentListProps> = ({ taskId }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [newCommentBody, setNewCommentBody] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.getTaskComments(taskId),
  });

  const createMutation = useMutation({
    mutationFn: (body: string) => commentsApi.createComment(taskId, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', taskId] });
      setNewCommentBody('');
      success('Comment added');
    },
    onError: (err: any) => {
      toastError('Failed to add comment', err.response?.data?.detail || 'An error occurred');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      commentsApi.updateComment(id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', taskId] });
      setEditingCommentId(null);
      setEditBody('');
      success('Comment updated');
    },
    onError: (err: any) => {
      toastError('Failed to update comment', err.response?.data?.detail || 'An error occurred');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => commentsApi.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', taskId] });
      setDeletingCommentId(null);
      success('Comment deleted');
    },
    onError: (err: any) => {
      toastError('Failed to delete comment', err.response?.data?.detail || 'An error occurred');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;
    createMutation.mutate(newCommentBody.trim());
  };

  const handleStartEdit = (comment: CommentResponse) => {
    setEditingCommentId(comment.id);
    setEditBody(comment.body);
  };

  const canManageComment = (comment: CommentResponse) => {
    if (!user) return false;
    return user.id === comment.author_id || user.role === 'admin' || user.role === 'manager';
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Composer */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="flex gap-3">
          <Avatar name={user?.username} email={user?.email} size="sm" className="mt-1" />
          <div className="flex-1">
            <Textarea
              rows={2}
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              placeholder="Add a comment... (Markdown formatting supported)"
              className="text-xs"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!newCommentBody.trim()}
            isLoading={createMutation.isPending}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Comment
          </Button>
        </div>
      </form>

      {/* Comment List */}
      <div className="flex flex-col gap-4 border-t border-[#EBECF0] pt-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-gray-500">No comments yet.</p>
            <p className="text-[11px] text-gray-400">Start the conversation above!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar size="sm" name={`User #${comment.author_id}`} className="mt-0.5" />
              <div className="flex-1 bg-[#FAFBFC] border border-[#EBECF0] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172B4D]">
                      {user?.id === comment.author_id ? 'You' : `User #${comment.author_id}`}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                    {comment.updated_at !== comment.created_at && (
                      <span className="text-[10px] text-gray-400 italic">(edited)</span>
                    )}
                  </div>

                  {canManageComment(comment) && editingCommentId !== comment.id && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(comment)}
                        className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                        title="Edit comment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCommentId(comment.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <Textarea
                      rows={2}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditBody('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!editBody.trim()}
                        isLoading={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({ id: comment.id, body: editBody.trim() })
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#172B4D] leading-relaxed whitespace-pre-wrap">
                    {comment.body}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingCommentId !== null}
        onClose={() => setDeletingCommentId(null)}
        onConfirm={() => {
          if (deletingCommentId) deleteMutation.mutate(deletingCommentId);
        }}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
