import React from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-[#42526E]">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={props.rows || 3}
          className={cn(
            'w-full px-3 py-2 text-sm bg-[#FAFBFC] border border-[#DFE1E6] rounded-md text-[#172B4D] placeholder-gray-400 transition-all duration-150',
            'focus:bg-white focus:outline-none focus:border-[#1868DB] focus:ring-2 focus:ring-[#1868DB]/20',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-200',
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-xs text-rose-600 font-medium animate-in fade-in-50">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
