import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpDown,
  CheckSquare,
  Columns,
  Filter,
  Kanban,
  List,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { projectsApi } from '@/api/projects';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { TaskTableView } from './TaskTableView';
import { TaskBoardView } from './TaskBoardView';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskCreateModal } from './TaskCreateModal';
import { AITaskCreateModal } from '@/features/ai/AITaskCreateModal';
import { TaskPriority, TaskResponse, TaskStatus } from '@/types';

interface TaskListPageProps {
  initialSearch?: string;
}

export const TaskListPage: React.FC<TaskListPageProps> = ({ initialSearch = '' }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  // Filters & State
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [search, setSearch] = useState<string>(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [onlyMyTasks, setOnlyMyTasks] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    'created_at' | 'updated_at' | 'deadline' | 'title' | 'status' | 'priority'
  >('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAICreateModalOpen, setIsAICreateModalOpen] = useState(false);

  // Load Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  // Query Tasks using actual backend query parameters
  const {
    data: tasks = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [
      'tasks',
      {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        project_id: projectFilter ? Number(projectFilter) : undefined,
        assignee_id: onlyMyTasks && user ? user.id : undefined,
        search: search.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    ],
    queryFn: () =>
      tasksApi.getTasks({
        status: (statusFilter as TaskStatus) || undefined,
        priority: (priorityFilter as TaskPriority) || undefined,
        project_id: projectFilter ? Number(projectFilter) : undefined,
        assignee_id: onlyMyTasks && user ? user.id : undefined,
        search: search.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 100,
      }),
  });

  // Quick status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: number; newStatus: TaskStatus }) =>
      tasksApi.updateTask(taskId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      success('Status updated');
    },
    onError: (err: any) => {
      toastError('Update Failed', err.response?.data?.detail || 'Failed to update status');
    },
  });

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setProjectFilter('');
    setOnlyMyTasks(false);
  };

  const hasActiveFilters =
    search || statusFilter || priorityFilter || projectFilter || onlyMyTasks;

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D] tracking-tight">Tasks</h1>
          <p className="text-xs text-[#6B778C] mt-0.5">
            Manage, track, and prioritize your team's workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Task Creation */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAICreateModalOpen(true)}
            className="text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-100"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
          >
            AI Prompt
          </Button>

          {/* Standard Create Task */}
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Filter and View Switcher Toolbar */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded-md focus:bg-white focus:outline-none focus:border-[#1868DB] transition-all"
            />
          </div>

          {/* My Tasks quick toggle */}
          <button
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              onlyMyTasks
                ? 'bg-[#DEEBFF] border-[#B3D4FF] text-[#0747A6]'
                : 'bg-white border-[#DFE1E6] text-[#42526E] hover:bg-gray-50'
            }`}
          >
            My Tasks Only
          </button>

          {/* Status filter */}
          <div className="w-32">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded-md text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#1868DB]"
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="w-28">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded-md text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#1868DB]"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Project filter */}
          <div className="w-36">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded-md text-[#172B4D] focus:bg-white focus:outline-none focus:border-[#1868DB]"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#1868DB] hover:underline font-medium px-1"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Right: View Mode Toggle & Refresh */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>

          {/* View toggle (Board vs List) */}
          <div className="inline-flex rounded-md border border-[#DFE1E6] bg-[#FAFBFC] p-0.5">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'board'
                  ? 'bg-white text-[#1868DB] shadow-xs'
                  : 'text-[#6B778C] hover:text-[#172B4D]'
              }`}
              title="Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#1868DB] shadow-xs'
                  : 'text-[#6B778C] hover:text-[#172B4D]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 bg-white border border-[#DFE1E6] rounded-lg text-center flex flex-col items-center justify-center">
          <CheckSquare className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#172B4D] mb-1">No tasks found</h3>
          <p className="text-xs text-[#6B778C] max-w-sm mb-5 leading-relaxed">
            {hasActiveFilters
              ? 'No tasks match your current filter criteria. Try resetting your search or filters.'
              : "Get started by creating your team's first task or generating one with AI."}
          </p>
          <div className="flex items-center gap-3">
            {hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Reset Filters
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Task
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAICreateModalOpen(true)}
                  leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
                >
                  Create with AI
                </Button>
              </>
            )}
          </div>
        </div>
      ) : viewMode === 'board' ? (
        <TaskBoardView
          tasks={tasks}
          projects={projects}
          onSelectTask={(t) => setSelectedTaskId(t.id)}
          onStatusChange={(taskId, newStatus) => statusMutation.mutate({ taskId, newStatus })}
        />
      ) : (
        <TaskTableView
          tasks={tasks}
          projects={projects}
          onSelectTask={(t) => setSelectedTaskId(t.id)}
          onStatusChange={(taskId, newStatus) => statusMutation.mutate({ taskId, newStatus })}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Create Task Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* AI Create Modal */}
      <AITaskCreateModal
        isOpen={isAICreateModalOpen}
        onClose={() => setIsAICreateModalOpen(false)}
        onOpenManualCreate={() => {
          setIsAICreateModalOpen(false);
          setIsCreateModalOpen(true);
        }}
      />
    </div>
  );
};
