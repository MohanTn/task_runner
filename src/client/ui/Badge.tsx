import type { ReactNode } from 'react';
import { cn } from './cn.js';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeVariant = 'soft' | 'outline' | 'solid';

interface BadgeProps {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  className?: string;
  children?: ReactNode;
  dot?: boolean;
}

const tones: Record<BadgeVariant, Record<BadgeTone, string>> = {
  soft: {
    neutral: 'bg-[color:var(--c-surface-2)] text-[color:var(--c-text-2)]',
    brand:   'bg-[color:var(--c-accent-soft)] text-[color:var(--c-accent)]',
    success: 'bg-[color:var(--c-success-soft)] text-[color:var(--c-success)]',
    warning: 'bg-[color:var(--c-warning-soft)] text-[color:var(--c-warning)]',
    danger:  'bg-[color:var(--c-danger-soft)] text-[color:var(--c-danger)]',
    info:    'bg-[color:var(--c-info-soft)] text-[color:var(--c-info)]',
  },
  outline: {
    neutral: 'border border-[color:var(--c-border-2)] text-[color:var(--c-text-2)]',
    brand:   'border border-[color:var(--c-accent)] text-[color:var(--c-accent)]',
    success: 'border border-[color:var(--c-success)] text-[color:var(--c-success)]',
    warning: 'border border-[color:var(--c-warning)] text-[color:var(--c-warning)]',
    danger:  'border border-[color:var(--c-danger)] text-[color:var(--c-danger)]',
    info:    'border border-[color:var(--c-info)] text-[color:var(--c-info)]',
  },
  solid: {
    neutral: 'bg-[color:var(--c-text-2)] text-white',
    brand:   'bg-[color:var(--c-accent)] text-white',
    success: 'bg-[color:var(--c-success)] text-white',
    warning: 'bg-[color:var(--c-warning)] text-white',
    danger:  'bg-[color:var(--c-danger)] text-white',
    info:    'bg-[color:var(--c-info)] text-white',
  },
};

const dotColors: Record<BadgeTone, string> = {
  neutral: 'bg-[color:var(--c-text-3)]',
  brand:   'bg-[color:var(--c-accent)]',
  success: 'bg-[color:var(--c-success)]',
  warning: 'bg-[color:var(--c-warning)]',
  danger:  'bg-[color:var(--c-danger)]',
  info:    'bg-[color:var(--c-info)]',
};

export function Badge({ tone = 'neutral', variant = 'soft', dot, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[11px] font-medium leading-none',
        tones[variant][tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone])} />}
      {children}
    </span>
  );
}
