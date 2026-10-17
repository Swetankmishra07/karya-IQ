import React from 'react';
import {
  ChevronDown,
  Equal,
  ChevronUp,
  ChevronsUp,
} from 'lucide-react';
import { TaskPriority } from '@/types';
import { cn } from '@/utils/cn';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const config: Record<
    TaskPriority,
    { label: string; icon: React.ReactNode; color: string; bg: string }
  > = {
    low: {
      label: 'Low',
      icon: <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />,
      color: 'text-[#2C68FF]',
      bg: 'bg-blue-50',
    },
    medium: {
      label: 'Medium',
      icon: <Equal className="w-3.5 h-3.5 stroke-[2.5]" />,
      color: 'text-[#FF8B00]',
      bg: 'bg-amber-50',
    },
    high: {
      label: 'High',
      icon: <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />,
      color: 'text-[#FF5630]',
      bg: 'bg-orange-50',
    },
    critical: {
      label: 'Critical',
      icon: <ChevronsUp className="w-3.5 h-3.5 stroke-[2.5]" />,
      color: 'text-[#DE350B]',
      bg: 'bg-rose-50',
    },
  };

  const current = config[priority] || config.low;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium select-none text-xs',
        current.color,
        className
      )}
      title={`Priority: ${current.label}`}
    >
      <span className="flex-shrink-0">{current.icon}</span>
      {showLabel && <span className="capitalize">{current.label}</span>}
    </span>
  );
};
