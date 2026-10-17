import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = 'gray',
  size = 'md',
  ...props
}) => {
  const variants = {
    gray: 'bg-[#DFE1E6] text-[#42526E]',
    blue: 'bg-[#DEEBFF] text-[#0747A6]',
    green: 'bg-[#E3FCEF] text-[#006644]',
    amber: 'bg-[#FFF0B3] text-[#172B4D]',
    red: 'bg-[#FFEBE6] text-[#BF2600]',
    purple: 'bg-[#EAE6FF] text-[#403294]',
  };

  const sizes = {
    sm: 'text-[11px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider',
    md: 'text-xs px-2 py-0.5 rounded font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 leading-none select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
