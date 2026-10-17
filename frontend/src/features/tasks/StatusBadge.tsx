import React from 'react';
import { TaskStatus } from '@/types';
import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className,
  onClick,
}) => {
  const config: Record<
    TaskStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    todo: {
      label: 'TO DO',
      bg: 'bg-[#F4F5F7]',
      text: 'text-[#42526E]',
      border: 'border-[#DFE1E6]',
      dot: 'bg-[#8993A4]',
    },
    in_progress: {
      label: 'IN PROGRESS',
      bg: 'bg-[#DEEBFF]',
      text: 'text-[#0747A6]',
      border: 'border-[#B3D4FF]',
      dot: 'bg-[#0052CC]',
    },
    pending: {
      label: 'PENDING',
      bg: 'bg-[#FFF0B3]',
      text: 'text-[#7A5A00]',
      border: 'border-[#FFE380]',
      dot: 'bg-[#FF991F]',
    },
    blocked: {
      label: 'BLOCKED',
      bg: 'bg-[#FFEBE6]',
      text: 'text-[#BF2600]',
      border: 'border-[#FFBDAD]',
      dot: 'bg-[#DE350B]',
    },
    completed: {
      label: 'COMPLETED',
      bg: 'bg-[#E3FCEF]',
      text: 'text-[#006644]',
      border: 'border-[#ABF5D1]',
      dot: 'bg-[#36B37E]',
    },
  };

  const current = config[status] || config.todo;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider',
    md: 'text-xs px-2.5 py-1 rounded font-semibold',
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 border select-none transition-all duration-150',
        current.bg,
        current.text,
        current.border,
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-85',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', current.dot)} />
      <span>{current.label}</span>
    </span>
  );
};
