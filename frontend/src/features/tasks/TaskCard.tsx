import React from 'react';
import { Calendar, ChevronRight, FolderGit2 } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { formatDeadline } from '@/utils/formatters';
import { TaskResponse, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';

interface TaskCardProps {
  task: TaskResponse;
  projectName?: string;
  onClick: () => void;
  onStatusChange?: (newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projectName,
  onClick,
  onStatusChange,
}) => {
  const { text: deadlineText, isOverdue, isSoon } = formatDeadline(task.deadline);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#DFE1E6] rounded-md p-3.5 shadow-card hover:border-[#1868DB] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group text-left"
    >
      {/* Top: Title & Project Badge */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[#6B778C] tracking-wide group-hover:text-[#1868DB] transition-colors">
            TASK-{task.id}
          </span>
          {projectName && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#42526E] bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
              <FolderGit2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{projectName}</span>
            </span>
          )}
        </div>

        <h3 className="text-xs font-semibold text-[#172B4D] line-clamp-2 leading-relaxed">
          {task.title}
        </h3>
      </div>

      {/* Middle/Bottom: Deadline & Priority & Status */}
      <div className="flex items-center justify-between pt-2 border-t border-[#EBECF0]/70 text-xs">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} showLabel={false} />

          {task.deadline && (
            <div
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium',
                isOverdue
                  ? 'text-rose-600 font-bold'
                  : isSoon
                  ? 'text-amber-600 font-semibold'
                  : 'text-gray-500'
              )}
              title={isOverdue ? 'Overdue deadline' : 'Deadline'}
            >
              <Calendar className="w-3 h-3" />
              <span>{deadlineText}</span>
            </div>
          )}
        </div>

        <div>
          <StatusBadge status={task.status} size="sm" />
        </div>
      </div>
    </div>
  );
};
