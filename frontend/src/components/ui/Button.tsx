import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-[#1868DB] hover:bg-[#1455B3] active:bg-[#0F428D] text-white shadow-sm focus:ring-[#1868DB]/40',
      secondary:
        'bg-[#EBECF0] hover:bg-[#DFE1E6] active:bg-[#C1C7D0] text-[#172B4D] focus:ring-gray-300',
      outline:
        'bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] text-[#172B4D] shadow-sm focus:ring-[#1868DB]/30',
      ghost:
        'bg-transparent hover:bg-[#EBECF0] text-[#42526E] hover:text-[#172B4D] focus:ring-gray-200',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm focus:ring-rose-500/40',
      accent:
        'bg-[#FFAB00] hover:bg-[#FF991F] active:bg-[#DE7000] text-[#172B4D] font-semibold shadow-sm focus:ring-[#FFAB00]/50',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
      md: 'text-sm px-3.5 py-2 rounded-md gap-2',
      lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
