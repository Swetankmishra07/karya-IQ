import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { teamsApi } from '@/api/teams';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ProjectCreate } from '@/types';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: number;
}

interface FormValues {
  team_id: string;
  name: string;
  description: string;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  defaultTeamId,
}) => {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getTeams,
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      team_id: defaultTeamId ? String(defaultTeamId) : '',
      name: '',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.createProject(data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      success('Project created', `"${project.name}" has been created.`);
      reset();
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to create project';
      toastError('Creation Failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!values.team_id) {
      toastError('Team Required', 'A project must belong to a team.');
      return;
    }

    createMutation.mutate({
      team_id: Number(values.team_id),
      name: values.name.trim(),
      description: values.description.trim() || null,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Project" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Team Selector */}
        <Select
          label="Team"
          required
          options={[
            { value: '', label: 'Select a Team...' },
            ...teams.map((t) => ({ value: t.id, label: t.name })),
          ]}
          error={errors.team_id?.message}
          {...register('team_id', { required: 'Please select a team for this project' })}
        />

        {/* Project Name */}
        <Input
          label="Project Name"
          required
          placeholder="e.g. Mobile App Redesign"
          error={errors.name?.message}
          {...register('name', {
            required: 'Project name is required',
            maxLength: { value: 100, message: 'Name must be 100 characters or less' },
          })}
        />

        {/* Description */}
        <Textarea
          label="Description"
          rows={3}
          placeholder="Brief summary of the project goals..."
          {...register('description')}
        />

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EBECF0]">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={createMutation.isPending}
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
