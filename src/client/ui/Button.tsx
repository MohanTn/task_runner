import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap ' +
  'rounded-md border transition-colors duration-100 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-ring)]';

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1',
  md: 'h-8 px-3 text-sm',
  lg: 'h-10 px-4 text-sm',
  icon: 'h-8 w-8 p-0',
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[color:var(--c-accent)] text-white border-[color:var(--c-accent)] ' +
    'hover:brightness-110 active:brightness-95',
  secondary:
    'bg-[color:var(--c-surface)] text-[color:var(--c-text)] border-[color:var(--c-border-2)] ' +
    'hover:bg-[color:var(--c-surface-2)]',
  ghost:
    'bg-transparent text-[color:var(--c-text-2)] border-transparent ' +
    'hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)]',
  subtle:
    'bg-[color:var(--c-surface-2)] text-[color:var(--c-text)] border-transparent ' +
    'hover:bg-[color:var(--c-surface-3)]',
  danger:
    'bg-transparent text-[color:var(--c-danger)] border-[color:var(--c-border)] ' +
    'hover:bg-[color:var(--c-danger-soft)] hover:border-[color:var(--c-danger)]',
  success:
    'bg-[color:var(--c-success)] text-white border-[color:var(--c-success)] ' +
    'hover:brightness-110',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', leftIcon, rightIcon, className, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
