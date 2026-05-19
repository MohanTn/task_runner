import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn.js';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'neutral' | 'danger' | 'brand';
  size?: 'sm' | 'md';
  label: string;
  children: ReactNode;
}

const sizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
};

const tones = {
  neutral:
    'text-[color:var(--c-text-2)] hover:text-[color:var(--c-text)] hover:bg-[color:var(--c-surface-2)]',
  danger:
    'text-[color:var(--c-text-2)] hover:text-[color:var(--c-danger)] hover:bg-[color:var(--c-danger-soft)]',
  brand:
    'text-[color:var(--c-text-2)] hover:text-[color:var(--c-accent)] hover:bg-[color:var(--c-accent-soft)]',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { tone = 'neutral', size = 'md', label, children, className, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-ring)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
