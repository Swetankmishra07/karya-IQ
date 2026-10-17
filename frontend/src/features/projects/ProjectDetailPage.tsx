import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  FolderGit2,
  Kanban,
  List,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import { teamsApi } from '@/api/teams';
import { usersApi } from '@/api/users';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskBoardView } from '@/features/tasks/TaskBoardView';
import { TaskTableView } from '@/features/tasks/TaskTableView';
import { TaskDetailModal } from '@/features/tasks/TaskDetailModal';
import { TaskCreateModal } from '@/features/tasks/TaskCreateModal';
import { formatDate } from '@/utils/formatters';
import { MembershipRole, ProjectMemberCreate, ProjectUpdate, TaskResponse, TaskStatus } from '@/types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'table'>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Member Management state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MembershipRole>('member');
  const [deletingMemberUserId, setDeletingMemberUserId] = useState<number | null>(null);

  // Fetch Project
  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !isNaN(projectId),
  });

  // Fetch Team
  const { data: team } = useQuery({
    queryKey: ['team', project?.team_id],
    queryFn: () => (project?.team_id ? teamsApi.getTeam(project.team_id) : null),
    enabled: !!project?.team_id,
  });

  // Fetch Project Tasks
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks', { project_id: projectId }],
    queryFn: () => tasksApi.getTasks({ project_id: projectId, limit: 100 }),
    enabled: !isNaN(projectId),
  });

  // Fetch Project Members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.getProjectMembers(projectId),
    enabled: !isNaN(projectId),
  });

  // Fetch Users (for adding members, if manager/admin)
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    enabled: isAddMemberOpen && isManagerOrAdmin,
    retry: false,
  });

  // Edit Project Mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: ProjectUpdate) => projectsApi.updateProject(projectId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditProjectOpen(false);
      success('Project updated', updated.name);
    },
    onError: (err: any) => {
      toastError('Update Failed', err.response?.data?.detail || 'Could not update project');
    },
  });

  // Delete Project Mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      success('Project deleted');
      navigate('/projects');
    },
    onError: (err: any) => {
      toastError('Delete Failed', err.response?.data?.detail || 'Could not delete project');
    },
  });

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: (data: ProjectMemberCreate) => projectsApi.addProjectMember(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setIsAddMemberOpen(false);
      setNewMemberUserId('');
      success('Member added to project');
    },
    onError: (err: any) => {
      toastError('Failed to add member', err.response?.data?.detail || 'Could not add member');
    },
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => projectsApi.removeProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setDeletingMemberUserId(null);
      success('Member removed from project');
    },
    onError: (err: any) => {
      toastError('Failed to remove member', err.response?.data?.detail || 'Could not remove member');
    },
  });

  // Quick status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: number; newStatus: TaskStatus }) =>
      tasksApi.updateTask(taskId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: projectId }] });
      success('Status updated');
    },
    onError: (err: any) => {
      toastError('Update Failed', err.response?.data?.detail || 'Failed to update status');
    },
  });

  if (isProjectLoading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="p-8 text-center bg-white border border-[#DFE1E6] rounded-lg">
        <h2 className="text-base font-bold text-gray-800">Project Not Found</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          You may not have access to this project or it might have been deleted.
        </p>
        <Link to="/projects">
          <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.id === project.owner_id || user?.role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#6B778C]">
        <Link to="/projects" className="hover:text-[#1868DB] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Projects</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#172B4D]">{project.name}</span>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1868DB] flex-shrink-0">
            <FolderGit2 className="w-6 h-6 stroke-[2]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#172B4D] tracking-tight">{project.name}</h1>
              {team && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#42526E] border border-gray-200">
                  Team: {team.name}
                </span>
              )}
            </div>

            <p className="text-xs text-[#6B778C] mt-1 leading-relaxed max-w-2xl">
              {project.description || 'No project description provided.'}
            </p>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Created {formatDate(project.created_at)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{members.length} Members</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isOwnerOrAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditName(project.name);
                  setEditDesc(project.description || '');
                  setIsEditProjectOpen(true);
                }}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateTaskOpen(true)}
            leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Tabs: Tasks vs Members */}
      <div className="flex items-center justify-between border-b border-[#DFE1E6] pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'tasks'
                ? 'border-[#1868DB] text-[#1868DB]'
                : 'border-transparent text-[#6B778C] hover:text-[#172B4D]'
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'members'
                ? 'border-[#1868DB] text-[#1868DB]'
                : 'border-transparent text-[#6B778C] hover:text-[#172B4D]'
            }`}
          >
            Members ({members.length})
          </button>
        </div>

        {activeTab === 'tasks' && (
          <div className="inline-flex rounded-md border border-[#DFE1E6] bg-[#FAFBFC] p-0.5">
            <button
              onClick={() => setTaskViewMode('board')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                taskViewMode === 'board'
                  ? 'bg-white text-[#1868DB] shadow-xs'
                  : 'text-[#6B778C] hover:text-[#172B4D]'
              }`}
              title="Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setTaskViewMode('table')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                taskViewMode === 'table'
                  ? 'bg-white text-[#1868DB] shadow-xs'
                  : 'text-[#6B778C] hover:text-[#172B4D]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Project Tasks */}
      {activeTab === 'tasks' && (
        <div>
          {isTasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-48 rounded" />
              <Skeleton className="h-48 rounded" />
              <Skeleton className="h-48 rounded" />
              <Skeleton className="h-48 rounded" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-10 bg-white border border-[#DFE1E6] rounded-lg text-center flex flex-col items-center">
              <FolderGit2 className="w-10 h-10 text-gray-300 mb-2" />
              <h3 className="text-sm font-bold text-[#172B4D]">No tasks in this project yet</h3>
              <p className="text-xs text-[#6B778C] mt-0.5 mb-4">
                Add issues, tasks, and deliverables to get work moving.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsCreateTaskOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Task
              </Button>
            </div>
          ) : taskViewMode === 'board' ? (
            <TaskBoardView
              tasks={tasks}
              projects={[project]}
              onSelectTask={(t) => setSelectedTaskId(t.id)}
              onStatusChange={(tId, newStatus) => statusMutation.mutate({ taskId: tId, newStatus })}
            />
          ) : (
            <TaskTableView
              tasks={tasks}
              projects={[project]}
              onSelectTask={(t) => setSelectedTaskId(t.id)}
              onStatusChange={(tId, newStatus) => statusMutation.mutate({ taskId: tId, newStatus })}
            />
          )}
        </div>
      )}

      {/* Tab 2: Project Members */}
      {activeTab === 'members' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B778C]">
              Project Collaborators
            </h3>
            {isOwnerOrAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddMemberOpen(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Add Member
              </Button>
            )}
          </div>

          <div className="bg-white border border-[#DFE1E6] rounded-lg shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-[#6B778C] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Added On</th>
                  {isOwnerOrAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBECF0]">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F4F5F7] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172B4D]">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        <span>User #{m.user_id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={m.role === 'manager' ? 'blue' : 'gray'}>
                        {m.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(m.created_at)}</td>
                    {isOwnerOrAdmin && (
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingMemberUserId(m.user_id)}
                          className="text-rose-600 hover:bg-rose-50 p-1 h-auto"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Create Task Modal */}
      <TaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={project.id}
      />

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        title="Edit Project"
        maxWidth="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Project Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            rows={3}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EBECF0]">
            <Button size="sm" variant="outline" onClick={() => setIsEditProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!editName.trim()}
              isLoading={updateProjectMutation.isPending}
              onClick={() =>
                updateProjectMutation.mutate({
                  name: editName.trim(),
                  description: editDesc.trim() || null,
                })
              }
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Add Member to Project"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          {allUsers.length > 0 ? (
            <Select
              label="Select User"
              required
              value={newMemberUserId}
              onChange={(e) => setNewMemberUserId(e.target.value)}
              options={[
                { value: '', label: 'Select a user...' },
                ...allUsers.map((u) => ({ value: u.id, label: `${u.username} (${u.email})` })),
              ]}
            />
          ) : (
            <Input
              label="User ID"
              type="number"
              required
              placeholder="e.g. 2"
              value={newMemberUserId}
              onChange={(e) => setNewMemberUserId(e.target.value)}
            />
          )}

          <Select
            label="Role within Project"
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as MembershipRole)}
            options={[
              { value: 'member', label: 'Member' },
              { value: 'manager', label: 'Manager' },
            ]}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EBECF0]">
            <Button size="sm" variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!newMemberUserId}
              isLoading={addMemberMutation.isPending}
              onClick={() =>
                addMemberMutation.mutate({
                  user_id: Number(newMemberUserId),
                  role: newMemberRole,
                })
              }
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Project */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => deleteProjectMutation.mutate()}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
        isLoading={deleteProjectMutation.isPending}
      />

      {/* Confirm Remove Member */}
      <ConfirmDialog
        isOpen={deletingMemberUserId !== null}
        onClose={() => setDeletingMemberUserId(null)}
        onConfirm={() => {
          if (deletingMemberUserId) removeMemberMutation.mutate(deletingMemberUserId);
        }}
        title="Remove Member"
        message="Are you sure you want to remove this member from the project?"
        confirmText="Remove"
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
};
