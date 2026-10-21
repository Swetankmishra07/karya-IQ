import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { aiApi } from '@/api/ai';
import { projectsApi } from '@/api/projects';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/features/tasks/PriorityBadge';
import { StatusBadge } from '@/features/tasks/StatusBadge';
import { TaskResponse } from '@/types';
import { extractApiErrorMessage, isAiNotConfiguredError } from '@/utils/apiErrors';

interface AITaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManualCreate: () => void;
}

export const AITaskCreateModal: React.FC<AITaskCreateModalProps> = ({
  isOpen,
  onClose,
  onOpenManualCreate,
}) => {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [createdTask, setCreatedTask] = useState<TaskResponse | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
    enabled: isOpen,
  });

  const aiMutation = useMutation({
    mutationFn: () =>
      aiApi.createTaskFromText({
        prompt: prompt.trim(),
        project_id: projectId ? Number(projectId) : undefined,
      }),
    onSuccess: (data) => {
      setCreatedTask(data);
      setConfigError(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      success('Task created with AI', `"${data.title}" was generated and saved.`);
    },
    onError: (err: any) => {
      const errorMsg = extractApiErrorMessage(err, 'AI task generation failed');
      if (isAiNotConfiguredError(err)) {
        setConfigError(errorMsg);
      } else {
        toastError('AI Error', errorMsg);
      }
    },
  });

  const handleClose = () => {
    setPrompt('');
    setCreatedTask(null);
    setConfigError(null);
    onClose();
  };

  const handleCreateAnother = () => {
    setPrompt('');
    setCreatedTask(null);
    setConfigError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center text-purple-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Create Task with AI</span>
        </div>
      }
      description="Write what needs to be done in natural language. The AI parses title, description, priority, and deadline automatically."
      maxWidth="lg"
    >
      {createdTask ? (
        <div className="flex flex-col gap-4 py-2">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-emerald-900">Task Successfully Created!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                The AI parsed and persisted the following task to your database:
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg flex flex-col gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase text-gray-500">Title</span>
              <p className="text-sm font-bold text-[#172B4D]">{createdTask.title}</p>
            </div>

            {createdTask.description && (
              <div>
                <span className="text-[11px] font-semibold uppercase text-gray-500">
                  Description
                </span>
                <p className="text-xs text-gray-700 leading-relaxed mt-0.5 whitespace-pre-wrap">
                  {createdTask.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2 border-t border-[#EBECF0]">
              <div>
                <span className="text-[10px] font-semibold uppercase text-gray-500 block mb-1">
                  Status
                </span>
                <StatusBadge status={createdTask.status} size="sm" />
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase text-gray-500 block mb-1">
                  Priority
                </span>
                <PriorityBadge priority={createdTask.priority} />
              </div>

              {createdTask.deadline && (
                <div>
                  <span className="text-[10px] font-semibold uppercase text-gray-500 block mb-1">
                    Deadline
                  </span>
                  <span className="text-xs text-[#172B4D]">
                    {new Date(createdTask.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={handleCreateAnother}>
              Create Another with AI
            </Button>
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {configError ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold text-sm mb-1">AI Not Configured on Server</p>
                  <p>{configError}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-amber-200/60">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleClose();
                    onOpenManualCreate();
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Open Standard Task Form
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Textarea
                label="Prompt"
                required
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Create a high-priority task to design and implement the user settings modal by next Wednesday..."
                helperText="Tip: Mention priority ('critical', 'high'), deadlines ('by tomorrow', 'Friday at 5pm'), and key requirements."
              />

              <Select
                label="Assign to Project (Optional)"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={[
                  { value: '', label: 'No Project (Unscoped)' },
                  ...(Array.isArray(projects) ? projects : []).map((p) => ({ value: p.id, label: p.name })),
                ]}
              />

              <div className="flex items-center justify-between pt-3 border-t border-[#EBECF0]">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenManualCreate();
                  }}
                  className="text-xs text-[#1868DB] hover:underline font-medium"
                >
                  Use standard task form instead
                </button>

                <div className="flex items-center gap-2.5">
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!prompt.trim()}
                    isLoading={aiMutation.isPending}
                    onClick={() => aiMutation.mutate()}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Generate & Create
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};
