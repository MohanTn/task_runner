import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn.js';

const baseField =
  'block w-full bg-[color:var(--c-surface)] border border-[color:var(--c-border-2)] ' +
  'rounded-md text-sm text-[color:var(--c-text)] placeholder:text-[color:var(--c-text-3)] ' +
  'transition-colors duration-100 ' +
  'focus:outline-none focus:border-[color:var(--c-accent)] focus:ring-2 focus:ring-[color:var(--c-ring)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(
  function Input({ className, mono, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(baseField, 'h-8 px-2.5', mono && 'font-mono', className)}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(baseField, 'h-8 px-2 pr-7 appearance-none', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
          backgroundSize: '16px 16px',
        }}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }>(
  function Textarea({ className, mono = true, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(baseField, 'px-2.5 py-2 resize-y leading-relaxed', mono && 'font-mono', className)}
        {...rest}
      />
    );
  },
);

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
}

export function Field({ label, hint, error, optional, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-[color:var(--c-text-2)] tracking-wide">
          {label}
          {optional && (
            <span className="ml-1 text-[color:var(--c-text-3)] font-normal">(optional)</span>
          )}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-[color:var(--c-text-3)]">{hint}</p>}
      {error && <p className="text-xs text-[color:var(--c-danger)]">{error}</p>}
    </div>
  );
}
