import React from 'react';
import { Calendar, FolderGit2, User as UserIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { formatDeadline } from '@/utils/formatters';
import { ProjectResponse, TaskResponse, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';

interface TaskTableViewProps {
  tasks: TaskResponse[];
  projects: ProjectResponse[];
  onSelectTask: (task: TaskResponse) => void;
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  projects,
  onSelectTask,
  onStatusChange,
}) => {
  const projectMap = new Map<number, string>(projects.map((p) => [p.id, p.name]));

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-lg shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-[#6B778C] font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-24">Key</th>
              <th className="py-3 px-4 min-w-[240px]">Title</th>
              <th className="py-3 px-4 w-36">Project</th>
              <th className="py-3 px-4 w-32">Status</th>
              <th className="py-3 px-4 w-28">Priority</th>
              <th className="py-3 px-4 w-36">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBECF0]">
            {tasks.map((task) => {
              const projectName = task.project_id ? projectMap.get(task.project_id) : null;
              const { text: deadlineText, isOverdue, isSoon } = formatDeadline(task.deadline);

              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="hover:bg-[#F4F5F7] cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-bold text-[#6B778C] group-hover:text-[#1868DB]">
                    TASK-{task.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#172B4D]">
                    <span className="line-clamp-1">{task.title}</span>
                  </td>
                  <td className="py-3 px-4 text-[#42526E]">
                    {projectName ? (
                      <span className="inline-flex items-center gap-1.5 truncate max-w-[140px]" title={projectName}>
                        <FolderGit2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{projectName}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={task.status} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="py-3 px-4">
                    {task.deadline ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 font-medium',
                          isOverdue
                            ? 'text-rose-600 font-bold'
                            : isSoon
                            ? 'text-amber-600 font-semibold'
                            : 'text-gray-500'
                        )}
                      >
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{deadlineText}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
