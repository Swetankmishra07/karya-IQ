import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Key,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { usersApi } from '@/api/users';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/utils/formatters';
import { UserRole } from '@/types';

interface PendingRoleChange {
  userId: number;
  username: string;
  currentRole: UserRole;
  role: UserRole;
}

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);

  const isAdmin = user?.role === 'admin';

  // Load all users for admin role management
  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    enabled: isAdmin,
  });

  // Role update mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      usersApi.changeUserRole(userId, role),
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      if (updatedUser.id === user?.id) {
        await refreshProfile();
      }
      success('Role updated', `${updatedUser.username} is now ${updatedUser.role}.`);
    },
    onError: (err: any) => {
      toastError(
        'Update Failed',
        err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          err.message ||
          'Failed to update role',
      );
    },
  });

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#172B4D] tracking-tight">Account & Profile</h1>
        <p className="text-xs text-[#6B778C] mt-0.5">
          View your profile credentials and organizational permissions.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar
            name={user?.username}
            email={user?.email}
            size="lg"
            className="w-16 h-16 text-xl shadow-md"
          />

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-[#172B4D]">{user?.username}</h2>
              <Badge
                variant={
                  user?.role === 'admin'
                    ? 'purple'
                    : user?.role === 'manager'
                    ? 'blue'
                    : 'green'
                }
              >
                {user?.role}
              </Badge>
            </div>

            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>{user?.email}</span>
            </p>

            <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Key className="w-3 h-3" />
                <span>User ID: #{user?.id}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Joined {formatDate(user?.created_at)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Capabilities Card */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-xs">
        <h3 className="text-sm font-bold text-[#172B4D] mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#1868DB]" />
          <span>Role Capabilities</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div
            className={`p-4 rounded-lg border ${
              user?.role === 'member'
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#172B4D]">Member</span>
              {user?.role === 'member' && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  Current
                </span>
              )}
            </div>
            <ul className="text-[#6B778C] space-y-1.5 text-[11px] list-disc pl-4">
              <li>View visible projects & tasks</li>
              <li>Create & update assigned tasks</li>
              <li>Post comments & upload files</li>
              <li>Use AI task drafting & summaries</li>
            </ul>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              user?.role === 'manager'
                ? 'border-blue-300 bg-blue-50/50'
                : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#172B4D]">Manager</span>
              {user?.role === 'manager' && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  Current
                </span>
              )}
            </div>
            <ul className="text-[#6B778C] space-y-1.5 text-[11px] list-disc pl-4">
              <li>All Member capabilities</li>
              <li>Assign tasks to team members</li>
              <li>Manage projects and team rosters</li>
              <li>View full user directory</li>
            </ul>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              user?.role === 'admin'
                ? 'border-purple-300 bg-purple-50/50'
                : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#172B4D]">Admin</span>
              {user?.role === 'admin' && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                  Current
                </span>
              )}
            </div>
            <ul className="text-[#6B778C] space-y-1.5 text-[11px] list-disc pl-4">
              <li>Full platform administrative access</li>
              <li>Modify user roles</li>
              <li>Assign and move tasks globally</li>
              <li>Access all projects and audit trails</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Admin Panel: Role Management */}
      {isAdmin && (
        <div className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>User Role Management (Admin)</span>
              </h3>
              <p className="text-xs text-[#6B778C] mt-0.5">
                Promote or reassign authorization roles for workspace members.
              </p>
            </div>
            <Badge variant="purple">Admin Only</Badge>
          </div>

          <div className="overflow-x-auto border border-[#DFE1E6] rounded-md">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-[#6B778C] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Current Role</th>
                  <th className="py-2.5 px-3">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBECF0]">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F4F5F7] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#172B4D]">
                      {u.username} {u.id === user?.id && <span className="text-gray-400 font-normal">(You)</span>}
                    </td>
                    <td className="py-2.5 px-3 text-[#42526E]">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          u.role === 'admin'
                            ? 'purple'
                            : u.role === 'manager'
                            ? 'blue'
                            : 'gray'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 w-40">
                      <select
                        value={u.role}
                        aria-label={`Assign role to ${u.username}`}
                        disabled={roleMutation.isPending}
                        onChange={(e) => {
                          const role = e.target.value as UserRole;
                          if (role !== u.role) {
                            setPendingRoleChange({
                              userId: u.id,
                              username: u.username,
                              currentRole: u.role,
                              role,
                            });
                          }
                        }}
                        className="w-full px-2 py-1 text-xs bg-[#FAFBFC] border border-[#DFE1E6] rounded text-[#172B4D] focus:outline-none focus:border-[#1868DB]"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingRoleChange !== null}
        onClose={() => setPendingRoleChange(null)}
        onConfirm={() => {
          if (!pendingRoleChange) return;
          roleMutation.mutate(
            { userId: pendingRoleChange.userId, role: pendingRoleChange.role },
            { onSettled: () => setPendingRoleChange(null) },
          );
        }}
        title="Confirm role change"
        message={
          pendingRoleChange
            ? `Change ${pendingRoleChange.username}'s role from ${pendingRoleChange.currentRole} to ${pendingRoleChange.role}?`
            : ''
        }
        confirmText="Change role"
        isDestructive={
          pendingRoleChange?.currentRole === 'admin' || pendingRoleChange?.role === 'admin'
        }
        isLoading={roleMutation.isPending}
      />
    </div>
  );
};
