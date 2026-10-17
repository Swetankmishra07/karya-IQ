import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  FileUp,
  History,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { commentsApi } from '@/api/comments';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/utils/formatters';
import { ActivityResponse } from '@/types';

interface ActivityTimelineProps {
  taskId: number;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ taskId }) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity', taskId],
    queryFn: () => commentsApi.getTaskActivity(taskId),
  });

  const getActionDetails = (act: ActivityResponse) => {
    switch (act.action) {
      case 'task_created':
        return {
          icon: <PlusCircle className="w-4 h-4 text-emerald-600" />,
          title: 'Created the task',
        };
      case 'task_updated':
        return {
          icon: <RefreshCw className="w-4 h-4 text-blue-600" />,
          title: 'Updated task details',
        };
      case 'comment_created':
        return {
          icon: <MessageSquare className="w-4 h-4 text-purple-600" />,
          title: 'Added a comment',
        };
      case 'comment_updated':
        return {
          icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
          title: 'Edited a comment',
        };
      case 'comment_deleted':
        return {
          icon: <History className="w-4 h-4 text-gray-500" />,
          title: 'Deleted a comment',
        };
      case 'attachment_uploaded':
        return {
          icon: <FileUp className="w-4 h-4 text-indigo-600" />,
          title: 'Uploaded an attachment',
        };
      case 'attachment_deleted':
        return {
          icon: <History className="w-4 h-4 text-rose-500" />,
          title: 'Deleted an attachment',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-500" />,
          title: act.action.replace(/_/g, ' '),
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs font-medium text-gray-500">No activity logged yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EBECF0]">
      {activities.map((act) => {
        const details = getActionDetails(act);
        const metadata = act.metadata_json || {};

        return (
          <div key={act.id} className="relative flex items-start gap-3">
            {/* Timeline icon node */}
            <div className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full bg-white border border-[#DFE1E6] flex items-center justify-center shadow-xs">
              {details.icon}
            </div>

            <div className="flex-1 bg-[#FAFBFC] border border-[#EBECF0] rounded-md p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#172B4D]">
                  {act.actor_id ? `User #${act.actor_id}` : 'System'}{' '}
                  <span className="font-normal text-[#6B778C]">{details.title}</span>
                </span>
                <span className="text-[10px] text-gray-400">
                  {formatRelativeTime(act.created_at)}
                </span>
              </div>

              {/* Render metadata changes if any */}
              {Object.keys(metadata).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-[#EBECF0]/60 text-[11px] text-[#6B778C] space-y-0.5">
                  {Object.entries(metadata).map(([key, value]) => {
                    if (
                      typeof value === 'object' &&
                      value !== null &&
                      'from' in value &&
                      'to' in value
                    ) {
                      return (
                        <div key={key} className="flex items-center gap-1.5">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="line-through text-gray-400">{String(value.from ?? 'none')}</span>
                          <span>→</span>
                          <span className="font-semibold text-[#172B4D]">{String(value.to ?? 'none')}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
