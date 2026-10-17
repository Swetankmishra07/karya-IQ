import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { aiApi } from '@/api/ai';
import { tasksApi } from '@/api/tasks';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/features/tasks/PriorityBadge';
import { AIPrioritySuggestionResponse, TaskPriority, TaskResponse } from '@/types';

interface AIAssistantDrawerProps {
  task: TaskResponse;
  onTaskUpdated?: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ task, onTaskUpdated }) => {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [summary, setSummary] = useState<string | null>(null);
  const [prioritySuggestion, setPrioritySuggestion] = useState<AIPrioritySuggestionResponse | null>(
    null
  );
  const [copiedSummary, setCopiedSummary] = useState(false);

  // AI Summary Mutation
  const summaryMutation = useMutation({
    mutationFn: () => aiApi.getTaskSummary(task.id),
    onSuccess: (data) => {
      setSummary(data.summary);
      success('AI Summary Generated');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to generate summary';
      toastError(
        'AI Unavailable',
        err.response?.status === 503
          ? 'AI is disabled in backend settings (AI_ENABLED=false).'
          : typeof msg === 'string'
          ? msg
          : 'Service error'
      );
    },
  });

  // AI Priority Suggestion Mutation
  const priorityMutation = useMutation({
    mutationFn: () => aiApi.getPrioritySuggestion(task.id),
    onSuccess: (data) => {
      setPrioritySuggestion(data);
      success('Priority Suggestion Ready');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to suggest priority';
      toastError(
        'AI Unavailable',
        err.response?.status === 503
          ? 'AI is disabled in backend settings (AI_ENABLED=false).'
          : typeof msg === 'string'
          ? msg
          : 'Service error'
      );
    },
  });

  // Apply suggested priority
  const applyPriorityMutation = useMutation({
    mutationFn: (newPriority: TaskPriority) =>
      tasksApi.updateTask(task.id, { priority: newPriority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['activity', task.id] });
      success('Priority Applied', `Task priority updated to ${prioritySuggestion?.priority}.`);
      onTaskUpdated?.();
    },
    onError: (err: any) => {
      toastError('Update Failed', err.response?.data?.detail || 'Could not update priority');
    },
  });

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Banner */}
      <div className="p-3.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/80 rounded-lg flex items-start gap-3">
        <div className="p-1.5 rounded-md bg-purple-100 text-purple-700 flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-[#172B4D]">AI Intelligence Hub</h4>
          <p className="text-[#6B778C] mt-0.5 leading-relaxed">
            Analyze this task, its discussion history, and activity events using your configured
            backend AI service.
          </p>
        </div>
      </div>

      {/* Feature 1: AI Task Summary */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-4 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
              Executive Summary
            </h4>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => summaryMutation.mutate()}
            isLoading={summaryMutation.isPending}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
          >
            {summary ? 'Regenerate' : 'Generate Summary'}
          </Button>
        </div>

        {summary ? (
          <div className="relative bg-[#FAFBFC] border border-[#EBECF0] rounded-md p-3 text-xs leading-relaxed text-[#172B4D]">
            <p className="whitespace-pre-wrap pr-6">{summary}</p>
            <button
              onClick={handleCopySummary}
              className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
              title="Copy summary"
            >
              {copiedSummary ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : summaryMutation.isPending ? (
          <div className="p-6 flex flex-col items-center justify-center gap-2 text-purple-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium text-gray-600">
              Summarizing task details and activity log...
            </span>
          </div>
        ) : (
          <p className="text-xs text-[#6B778C] italic">
            Click 'Generate Summary' to get a concise synthesis of this task and recent comments.
          </p>
        )}
      </div>

      {/* Feature 2: Priority Suggestion */}
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-4 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
              Priority Advisor
            </h4>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => priorityMutation.mutate()}
            isLoading={priorityMutation.isPending}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          >
            {prioritySuggestion ? 'Re-evaluate' : 'Suggest Priority'}
          </Button>
        </div>

        {prioritySuggestion ? (
          <div className="flex flex-col gap-3 bg-[#FAFBFC] border border-[#EBECF0] rounded-md p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Suggested Priority:</span>
                <PriorityBadge priority={prioritySuggestion.priority} />
              </div>

              {prioritySuggestion.priority !== task.priority && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => applyPriorityMutation.mutate(prioritySuggestion.priority)}
                  isLoading={applyPriorityMutation.isPending}
                >
                  Apply {prioritySuggestion.priority}
                </Button>
              )}
            </div>

            <div className="text-[#6B778C] leading-relaxed pt-2 border-t border-[#EBECF0]">
              <span className="font-semibold text-[#172B4D] block mb-0.5">Rationale:</span>
              <p>{prioritySuggestion.explanation}</p>
            </div>
          </div>
        ) : priorityMutation.isPending ? (
          <div className="p-6 flex flex-col items-center justify-center gap-2 text-amber-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium text-gray-600">
              Evaluating deadlines and dependencies...
            </span>
          </div>
        ) : (
          <p className="text-xs text-[#6B778C] italic">
            Let AI analyze urgency and deadlines to recommend an optimal priority level.
          </p>
        )}
      </div>
    </div>
  );
};
