import React from 'react';
import { cn } from '@/utils/cn';

interface BrandLogoProps {
  light?: boolean;
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  light = false,
  compact = false,
  iconOnly = false,
  className,
}) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        compact ? 'h-8 w-8' : 'h-9 w-9',
        light
          ? 'bg-white text-[#14213D] shadow-sm'
          : 'bg-[#14213D] text-white shadow-sm'
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-[72%] w-[72%]">
        <path
          d="M9 7.5v17M10 16l12-8.5M10 16l12 8.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.2"
        />
        <circle cx="23.5" cy="8" r="2.5" fill="#4F8CFF" />
      </svg>
    </span>
    {!iconOnly && (
      <span
        className={cn(
          'font-bold tracking-[-0.04em]',
          compact ? 'text-[17px]' : 'text-xl',
          light ? 'text-white' : 'text-[#14213D]'
        )}
      >
        KaryaIQ
      </span>
    )}
  </span>
);
