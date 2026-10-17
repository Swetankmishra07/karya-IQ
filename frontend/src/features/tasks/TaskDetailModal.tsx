import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  FolderGit2,
  Paperclip,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { projectsApi } from '@/api/projects';
import { usersApi } from '@/api/users';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { CommentList } from '@/features/comments/CommentList';
import { ActivityTimeline } from '@/features/activity/ActivityTimeline';
import { AttachmentList } from '@/features/attachments/AttachmentList';
import { AIAssistantDrawer } from '@/features/ai/AIAssistantDrawer';
import { formatDateTime } from '@/utils/formatters';
import { TaskPriority, TaskResponse, TaskStatus, TaskUpdate } from '@/types';

interface TaskDetailModalProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'attachments' | 'ai'>('comments');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Fetch task data
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => (taskId ? tasksApi.getTask(taskId) : null),
    enabled: isOpen && taskId !== null,
  });

  // Projects list
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
    enabled: isOpen,
  });

  // Users list (for assignees)
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    enabled: isOpen && isManagerOrAdmin,
    retry: false,
  });

  // Project members if project is selected and user is regular member
  const { data: projectMembers = [] } = useQuery({
    queryKey: ['project-members', task?.project_id],
    queryFn: () => (task?.project_id ? projectsApi.getProjectMembers(task.project_id) : []),
    enabled: isOpen && !isManagerOrAdmin && !!task?.project_id,
  });

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescValue(task.description || '');
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: (updateData: TaskUpdate) => {
      if (!taskId) throw new Error('No task selected');
      return tasksApi.updateTask(taskId, updateData);
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', taskId] });
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      success('Task updated');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to update task';
      toastError('Update Failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!taskId) throw new Error('No task selected');
      return tasksApi.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsConfirmDeleteOpen(false);
      onClose();
      success('Task deleted successfully');
    },
    onError: (err: any) => {
      toastError('Delete Failed', err.response?.data?.detail || 'Could not delete task');
    },
  });

  if (!task && !isLoading) return null;

  const currentProject = projects.find((p) => p.id === task?.project_id);
  const assigneeUser = users.find((u) => u.id === task?.assignee_id);

  const canDelete =
    user?.role === 'admin' ||
    user?.role === 'manager' ||
    user?.id === task?.creator_id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2 text-xs text-[#6B778C]">
          <span className="font-semibold text-[#1868DB]">TASK-{task?.id}</span>
          <span>•</span>
          <span>{currentProject ? currentProject.name : 'No Project'}</span>
        </div>
      }
    >
      {isLoading || !task ? (
        <div className="flex flex-col gap-4 py-8">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4" />
          <div className="h-24 bg-gray-100 animate-pulse rounded" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column (2 spans): Title, Description, Tabs */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Title Section */}
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="flex-1 text-base font-bold text-[#172B4D] px-2.5 py-1.5 border border-[#1868DB] rounded-md focus:outline-none"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!titleValue.trim()}
                    isLoading={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ title: titleValue.trim() })}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTitleValue(task.title);
                      setIsEditingTitle(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg font-bold text-[#172B4D] cursor-pointer hover:bg-gray-100/70 p-1.5 -ml-1.5 rounded-md transition-colors leading-snug"
                  title="Click to edit title"
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* Description Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B778C]">
                  Description
                </span>
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-[#1868DB] hover:underline font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={4}
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    placeholder="Add a detailed description..."
                    className="w-full text-xs text-[#172B4D] p-3 border border-[#1868DB] rounded-md focus:outline-none bg-white"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDescValue(task.description || '');
                        setIsEditingDescription(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({ description: descValue.trim() || null })
                      }
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDescription(true)}
                  className="text-xs text-[#172B4D] leading-relaxed p-3 bg-[#FAFBFC] border border-[#EBECF0] rounded-md cursor-pointer hover:border-gray-300 min-h-[60px] whitespace-pre-wrap transition-colors"
                  title="Click to edit description"
                >
                  {task.description || (
                    <span className="text-gray-400 italic">No description provided. Click to add one.</span>
                  )}
                </div>
              )}
            </div>

            {/* Tabs for Activity / Comments / Attachments / AI */}
            <div className="border-t border-[#EBECF0] pt-4">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 border-b border-[#EBECF0] pb-2 mb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'comments'
                      ? 'bg-[#DEEBFF] text-[#0747A6]'
                      : 'text-[#42526E] hover:bg-[#EBECF0]'
                  }`}
                >
                  <span>Comments</span>
                </button>

                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'activity'
                      ? 'bg-[#DEEBFF] text-[#0747A6]'
                      : 'text-[#42526E] hover:bg-[#EBECF0]'
                  }`}
                >
                  <span>Activity History</span>
                </button>

                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'attachments'
                      ? 'bg-[#DEEBFF] text-[#0747A6]'
                      : 'text-[#42526E] hover:bg-[#EBECF0]'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments</span>
                </button>

                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'ai'
                      ? 'bg-purple-100 text-purple-800 font-bold'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>AI Assistant</span>
                </button>
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === 'comments' && <CommentList taskId={task.id} />}
                {activeTab === 'activity' && <ActivityTimeline taskId={task.id} />}
                {activeTab === 'attachments' && <AttachmentList taskId={task.id} />}
                {activeTab === 'ai' && (
                  <AIAssistantDrawer task={task} onTaskUpdated={() => queryClient.invalidateQueries({ queryKey: ['task', task.id] })} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 span): Metadata & Properties Sidebar */}
          <div className="flex flex-col gap-5 bg-[#FAFBFC] p-4 rounded-lg border border-[#EBECF0] h-fit">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B778C]">
              Details
            </h4>

            {/* Status Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#42526E]">Status</label>
              <Select
                value={task.status}
                onChange={(e) => updateMutation.mutate({ status: e.target.value as TaskStatus })}
                options={[
                  { value: 'todo', label: 'To Do' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'blocked', label: 'Blocked' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>

            {/* Priority Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#42526E]">Priority</label>
              <Select
                value={task.priority}
                onChange={(e) => updateMutation.mutate({ priority: e.target.value as TaskPriority })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
              />
            </div>

            {/* Assignee Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#42526E] flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                <span>Assignee</span>
              </label>
              <Select
                value={task.assignee_id ? String(task.assignee_id) : ''}
                onChange={(e) =>
                  updateMutation.mutate({
                    assignee_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                options={[
                  { value: '', label: 'Unassigned' },
                  ...(isManagerOrAdmin
                    ? users.map((u) => ({
                        value: u.id,
                        label: `${u.username} (${u.email})`,
                      }))
                    : projectMembers.map((m) => ({
                        value: m.user_id,
                        label: `Member #${m.user_id}`,
                      }))),
                ]}
              />
            </div>

            {/* Project Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#42526E] flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Project</span>
              </label>
              <Select
                value={task.project_id ? String(task.project_id) : ''}
                onChange={(e) =>
                  updateMutation.mutate({
                    project_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                options={[
                  { value: '', label: 'No Project (Unscoped)' },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>

            {/* Deadline Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#42526E] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Deadline</span>
              </label>
              <input
                type="datetime-local"
                value={task.deadline ? task.deadline.substring(0, 16) : ''}
                onChange={(e) =>
                  updateMutation.mutate({
                    deadline: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="w-full text-xs px-2.5 py-1.5 border border-[#DFE1E6] rounded-md bg-white focus:outline-none focus:border-[#1868DB]"
              />
            </div>

            {/* Timestamps & Audit */}
            <div className="pt-3 border-t border-[#EBECF0] text-[11px] text-[#6B778C] space-y-1">
              <div>
                <span className="font-semibold text-gray-500">Created: </span>
                {formatDateTime(task.created_at)}
              </div>
              <div>
                <span className="font-semibold text-gray-500">Updated: </span>
                {formatDateTime(task.updated_at)}
              </div>
              <div>
                <span className="font-semibold text-gray-500">Creator ID: </span>
                User #{task.creator_id}
              </div>
            </div>

            {/* Delete Task (Destructive Action) */}
            {canDelete && (
              <div className="pt-3 border-t border-[#EBECF0]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete Task
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Task"
        message={`Are you sure you want to permanently delete task "${task?.title}"? All comments, attachments, and logs associated with this task will be removed.`}
        confirmText="Delete Task"
        isLoading={deleteMutation.isPending}
      />
    </Modal>
  );
};
