import React from 'react';
import { TaskCard } from './TaskCard';
import { ProjectResponse, TaskResponse, TaskStatus } from '@/types';

interface TaskBoardViewProps {
  tasks: TaskResponse[];
  projects: ProjectResponse[];
  onSelectTask: (task: TaskResponse) => void;
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
}

const COLUMNS: Array<{ id: TaskStatus; title: string; color: string; badgeBg: string }> = [
  { id: 'todo', title: 'TO DO', color: 'border-t-slate-400', badgeBg: 'bg-slate-200 text-slate-700' },
  { id: 'in_progress', title: 'IN PROGRESS', color: 'border-t-blue-500', badgeBg: 'bg-blue-100 text-blue-700' },
  { id: 'pending', title: 'PENDING', color: 'border-t-amber-500', badgeBg: 'bg-amber-100 text-amber-700' },
  { id: 'blocked', title: 'BLOCKED', color: 'border-t-rose-500', badgeBg: 'bg-rose-100 text-rose-700' },
  { id: 'completed', title: 'DONE', color: 'border-t-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-700' },
];

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  tasks,
  projects,
  onSelectTask,
  onStatusChange,
}) => {
  const projectMap = new Map<number, string>(projects.map((p) => [p.id, p.name]));

  // Group tasks by status
  const tasksByStatus: Record<TaskStatus, TaskResponse[]> = {
    todo: [],
    in_progress: [],
    pending: [],
    blocked: [],
    completed: [],
  };

  tasks.forEach((task) => {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task);
    } else {
      tasksByStatus.todo.push(task);
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasksByStatus[col.id] || [];

        return (
          <div
            key={col.id}
            className={`flex flex-col bg-[#F4F5F7] rounded-lg border border-[#DFE1E6] border-t-4 ${col.color} min-w-[260px] max-h-[calc(100vh-210px)] flex-shrink-0`}
          >
            {/* Column Header */}
            <div className="p-3 flex items-center justify-between border-b border-[#EBECF0]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
                {col.title}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards Container */}
            <div className="p-2.5 flex flex-col gap-2.5 overflow-y-auto flex-1">
              {columnTasks.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs italic">
                  No tasks
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectName={task.project_id ? projectMap.get(task.project_id) : undefined}
                    onClick={() => onSelectTask(task)}
                    onStatusChange={(newStatus) => onStatusChange?.(task.id, newStatus)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
