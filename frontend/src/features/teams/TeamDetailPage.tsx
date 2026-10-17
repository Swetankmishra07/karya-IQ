import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Edit2,
  FolderGit2,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { teamsApi } from '@/api/teams';
import { projectsApi } from '@/api/projects';
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
import { ProjectCreateModal } from '@/features/projects/ProjectCreateModal';
import { formatDate } from '@/utils/formatters';
import { MembershipRole, TeamMemberCreate, TeamUpdate } from '@/types';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'projects' | 'members'>('projects');
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  // Member management state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MembershipRole>('member');
  const [deletingMemberUserId, setDeletingMemberUserId] = useState<number | null>(null);

  // Fetch Team
  const { data: team, isLoading: isTeamLoading, error: teamError } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getTeam(teamId),
    enabled: !isNaN(teamId),
  });

  // Fetch Team Members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamsApi.getTeamMembers(teamId),
    enabled: !isNaN(teamId),
  });

  // Fetch Projects belonging to this team
  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const teamProjects = allProjects.filter((p) => p.team_id === teamId);

  // Users list (if manager/admin)
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    enabled: isAddMemberOpen && isManagerOrAdmin,
    retry: false,
  });

  // Edit Team Mutation
  const updateTeamMutation = useMutation({
    mutationFn: (data: TeamUpdate) => teamsApi.updateTeam(teamId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsEditTeamOpen(false);
      success('Team updated', updated.name);
    },
    onError: (err: any) => {
      toastError('Update Failed', err.response?.data?.detail || 'Could not update team');
    },
  });

  // Delete Team Mutation
  const deleteTeamMutation = useMutation({
    mutationFn: () => teamsApi.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      success('Team deleted');
      navigate('/teams');
    },
    onError: (err: any) => {
      toastError('Delete Failed', err.response?.data?.detail || 'Could not delete team');
    },
  });

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: (data: TeamMemberCreate) => teamsApi.addTeamMember(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      setIsAddMemberOpen(false);
      setNewMemberUserId('');
      success('Member added to team');
    },
    onError: (err: any) => {
      toastError('Failed to add member', err.response?.data?.detail || 'Could not add member');
    },
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => teamsApi.removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      setDeletingMemberUserId(null);
      success('Member removed from team');
    },
    onError: (err: any) => {
      toastError('Failed to remove member', err.response?.data?.detail || 'Could not remove member');
    },
  });

  if (isTeamLoading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="p-8 text-center bg-white border border-[#DFE1E6] rounded-lg">
        <h2 className="text-base font-bold text-gray-800">Team Not Found</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          You may not have access to this team or it might have been deleted.
        </p>
        <Link to="/teams">
          <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Teams
          </Button>
        </Link>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.id === team.owner_id || user?.role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#6B778C]">
        <Link to="/teams" className="hover:text-[#1868DB] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Teams</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#172B4D]">{team.name}</span>
      </div>

      {/* Team Header Banner */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 flex-shrink-0">
            <Users className="w-6 h-6 stroke-[2]" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#172B4D] tracking-tight">{team.name}</h1>
            <p className="text-xs text-[#6B778C] mt-1 leading-relaxed max-w-2xl">
              {team.description || 'No team description provided.'}
            </p>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Created {formatDate(team.created_at)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{members.length} Members</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FolderGit2 className="w-3 h-3" />
                <span>{teamProjects.length} Projects</span>
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
                  setEditName(team.name);
                  setEditDesc(team.description || '');
                  setIsEditTeamOpen(true);
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
            onClick={() => setIsCreateProjectOpen(true)}
            leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Tabs: Projects vs Members */}
      <div className="flex items-center gap-2 border-b border-[#DFE1E6] pb-1">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'projects'
              ? 'border-[#1868DB] text-[#1868DB]'
              : 'border-transparent text-[#6B778C] hover:text-[#172B4D]'
          }`}
        >
          Projects ({teamProjects.length})
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

      {/* Tab 1: Team Projects */}
      {activeTab === 'projects' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B778C]">
              Team Projects
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateProjectOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Project
            </Button>
          </div>

          {teamProjects.length === 0 ? (
            <div className="p-10 bg-white border border-[#DFE1E6] rounded-lg text-center flex flex-col items-center">
              <FolderGit2 className="w-10 h-10 text-gray-300 mb-2" />
              <h3 className="text-sm font-bold text-[#172B4D]">No projects in this team</h3>
              <p className="text-xs text-[#6B778C] mt-0.5 mb-4">
                Create a project to start planning sprints and organizing tasks.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsCreateProjectOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="bg-white border border-[#DFE1E6] rounded-lg p-5 shadow-card hover:border-[#1868DB] hover:shadow-md transition-all flex flex-col justify-between gap-3 group text-left"
                >
                  <div>
                    <h4 className="text-sm font-bold text-[#172B4D] group-hover:text-[#1868DB] transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-xs text-[#6B778C] line-clamp-2 mt-1 leading-relaxed">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#EBECF0] text-[11px] text-[#1868DB] font-semibold">
                    <span>Open Project</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Team Members */}
      {activeTab === 'members' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B778C]">
              Team Members
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
                  <th className="py-3 px-4">Joined On</th>
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

      {/* Edit Team Modal */}
      <Modal
        isOpen={isEditTeamOpen}
        onClose={() => setIsEditTeamOpen(false)}
        title="Edit Team"
        maxWidth="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Team Name"
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
            <Button size="sm" variant="outline" onClick={() => setIsEditTeamOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!editName.trim()}
              isLoading={updateTeamMutation.isPending}
              onClick={() =>
                updateTeamMutation.mutate({
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
        title="Add Member to Team"
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
            label="Role within Team"
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

      {/* Project Create Modal */}
      <ProjectCreateModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        defaultTeamId={team.id}
      />

      {/* Delete Team Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => deleteTeamMutation.mutate()}
        title="Delete Team"
        message={`Are you sure you want to permanently delete team "${team.name}"? This action cannot be undone.`}
        confirmText="Delete Team"
        isLoading={deleteTeamMutation.isPending}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={deletingMemberUserId !== null}
        onClose={() => setDeletingMemberUserId(null)}
        onConfirm={() => {
          if (deletingMemberUserId) removeMemberMutation.mutate(deletingMemberUserId);
        }}
        title="Remove Team Member"
        message="Are you sure you want to remove this member from the team?"
        confirmText="Remove"
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
};
