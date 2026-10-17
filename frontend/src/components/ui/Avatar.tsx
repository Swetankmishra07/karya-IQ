import React from 'react';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  role?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  email,
  size = 'md',
  role,
  className,
  ...props
}) => {
  const initials = getInitials(name || email || '?');

  // Deterministic palette based on initials
  const colors = [
    'bg-blue-600 text-white',
    'bg-indigo-600 text-white',
    'bg-emerald-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-purple-600 text-white',
    'bg-teal-600 text-white',
  ];
  const charCode = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  const colorClass = colors[charCode % colors.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs font-semibold',
    lg: 'w-10 h-10 text-sm font-semibold',
  };

  return (
    <div className="relative inline-block" title={name || email}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-medium select-none shadow-sm',
          sizeClasses[size],
          colorClass,
          className
        )}
        {...props}
      >
        {initials}
      </div>
      {role && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
            role === 'admin'
              ? 'bg-purple-500'
              : role === 'manager'
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          )}
          title={`Role: ${role}`}
        />
      )}
    </div>
  );
};
