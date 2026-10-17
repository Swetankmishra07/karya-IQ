import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Filter,
  Inbox,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { notificationsApi } from '@/api/notifications';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/utils/formatters';
import { NotificationResponse } from '@/types';
import { cn } from '@/utils/cn';

export const NotificationsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [unreadOnly, setUnreadOnly] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: () => notificationsApi.getNotifications(unreadOnly),
  });

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      success('Marked as read');
    },
    onError: (err: any) => {
      toastError('Action Failed', err.response?.data?.detail || 'Could not mark as read');
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      success('All notifications marked as read');
    },
    onError: (err: any) => {
      toastError('Action Failed', err.response?.data?.detail || 'Could not mark all as read');
    },
  });

  // Delete notification
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      success('Notification deleted');
    },
    onError: (err: any) => {
      toastError('Delete Failed', err.response?.data?.detail || 'Could not delete notification');
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D] tracking-tight">Notifications</h1>
          <p className="text-xs text-[#6B778C] mt-0.5">
            Stay updated with task assignments, deadlines, mentions, and project activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              isLoading={markAllReadMutation.isPending}
              leftIcon={<CheckCheck className="w-4 h-4" />}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DFE1E6] pb-1">
        <button
          onClick={() => setUnreadOnly(false)}
          className={cn(
            'px-3 py-2 text-xs font-semibold border-b-2 transition-all',
            !unreadOnly
              ? 'border-[#1868DB] text-[#1868DB]'
              : 'border-transparent text-[#6B778C] hover:text-[#172B4D]'
          )}
        >
          All Notifications
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={cn(
            'px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5',
            unreadOnly
              ? 'border-[#1868DB] text-[#1868DB]'
              : 'border-transparent text-[#6B778C] hover:text-[#172B4D]'
          )}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 bg-white border border-[#DFE1E6] rounded-lg text-center flex flex-col items-center justify-center">
          <Inbox className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#172B4D] mb-1">
            {unreadOnly ? 'No unread notifications' : 'No notifications'}
          </h3>
          <p className="text-xs text-[#6B778C] max-w-sm">
            {unreadOnly
              ? "You're all caught up! Check back later for task updates."
              : 'When someone assigns you a task or comments on your work, updates will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#DFE1E6] rounded-lg divide-y divide-[#EBECF0] shadow-xs overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'p-4 flex items-start justify-between gap-4 transition-colors',
                !n.is_read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-[#FAFBFC]'
              )}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Status Dot / Icon */}
                <div className="mt-1 flex-shrink-0">
                  {!n.is_read ? (
                    <span className="block w-2.5 h-2.5 rounded-full bg-[#1868DB]" title="Unread" />
                  ) : (
                    <span className="block w-2.5 h-2.5 rounded-full bg-gray-300" title="Read" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#172B4D] leading-snug truncate">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(n.created_at)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#42526E] mt-1 leading-relaxed whitespace-pre-wrap">
                    {n.message}
                  </p>

                  {n.task_id && (
                    <div className="mt-2">
                      <span className="inline-flex items-center text-[10px] font-semibold text-[#1868DB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        TASK-{n.task_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markReadMutation.mutate(n.id)}
                    title="Mark as read"
                    className="p-1.5 h-auto text-blue-600 hover:bg-blue-100"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(n.id)}
                  title="Delete notification"
                  className="p-1.5 h-auto text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
