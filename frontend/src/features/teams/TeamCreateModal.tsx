import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/api/teams';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { TeamCreate } from '@/types';

interface TeamCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  name: string;
  description: string;
}

export const TeamCreateModal: React.FC<TeamCreateModalProps> = ({ isOpen, onClose }) => {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TeamCreate) => teamsApi.createTeam(data),
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      success('Team created', `"${team.name}" has been created.`);
      reset();
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to create team';
      toastError('Creation Failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({
      name: values.name.trim(),
      description: values.description.trim() || null,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Team" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Team Name"
          required
          placeholder="e.g. Core Engineering, Product Design"
          error={errors.name?.message}
          {...register('name', {
            required: 'Team name is required',
            maxLength: { value: 100, message: 'Name must be 100 characters or less' },
          })}
        />

        <Textarea
          label="Description"
          rows={3}
          placeholder="What is this team's focus and mission?"
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
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
};
