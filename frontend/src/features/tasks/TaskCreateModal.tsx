import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { projectsApi } from '@/api/projects';
import { usersApi } from '@/api/users';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TaskCreate, TaskPriority, TaskStatus } from '@/types';
import { extractApiErrorMessage } from '@/utils/apiErrors';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: number;
}

interface FormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  project_id: string;
  assignee_id: string;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  // Load available projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
    enabled: isOpen,
  });

  // Load users (managers and admins can query /users)
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    enabled: isOpen && isManagerOrAdmin,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'low',
      deadline: '',
      project_id: defaultProjectId ? String(defaultProjectId) : '',
      assignee_id: '',
    },
  });

  const selectedProjectId = watch('project_id');

  // If a project is selected and user is a regular member, load project members
  const { data: projectMembers = [] } = useQuery({
    queryKey: ['project-members', selectedProjectId],
    queryFn: () => projectsApi.getProjectMembers(Number(selectedProjectId)),
    enabled: isOpen && !isManagerOrAdmin && !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.createTask(data),
    onSuccess: (createdTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      success('Task created successfully', `"${createdTask.title}" has been created.`);
      reset();
      onClose();
    },
    onError: (err: any) => {
      const msg = extractApiErrorMessage(err, 'Failed to create task');
      toastError('Creation Failed', msg);
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: TaskCreate = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      status: values.status,
      priority: values.priority,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      project_id: values.project_id ? Number(values.project_id) : null,
      assignee_id: values.assignee_id ? Number(values.assignee_id) : null,
    };

    createMutation.mutate(payload);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Task" maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Title */}
        <Input
          label="Task Title"
          required
          placeholder="e.g. Implement authentication module"
          error={errors.title?.message}
          {...register('title', {
            required: 'Task title is required',
            maxLength: { value: 100, message: 'Title must be 100 characters or less' },
          })}
        />

        {/* Description */}
        <Textarea
          label="Description"
          rows={3}
          placeholder="Add details, acceptance criteria, or context..."
          {...register('description')}
        />

        {/* Status & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'pending', label: 'Pending' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'completed', label: 'Completed' },
            ]}
            {...register('status')}
          />

          <Select
            label="Priority"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            {...register('priority')}
          />
        </div>

        {/* Project & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Project"
            options={[
              { value: '', label: 'No Project (Unscoped)' },
              ...(Array.isArray(projects) ? projects : []).map((p) => ({ value: p.id, label: p.name })),
            ]}
            {...register('project_id')}
          />

          <Select
            label="Assignee"
            options={[
              { value: '', label: 'Unassigned' },
              ...(isManagerOrAdmin
                ? (Array.isArray(users) ? users : []).map((u) => ({
                    value: u.id,
                    label: `${u.username} (${u.email})`,
                  }))
                : (Array.isArray(projectMembers) ? projectMembers : []).map((m) => ({
                    value: m.user_id,
                    label: `Member #${m.user_id} (${m.role})`,
                  }))),
            ]}
            {...register('assignee_id')}
          />
        </div>

        {/* Deadline */}
        <Input
          label="Deadline"
          type="datetime-local"
          {...register('deadline')}
        />

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBECF0] mt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={createMutation.isPending}
          >
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
