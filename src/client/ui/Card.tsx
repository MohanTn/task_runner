import type { ReactNode } from 'react';
import { cn } from './cn.js';

interface CardProps {
  className?: string;
  children?: ReactNode;
  as?: 'div' | 'section' | 'article';
  padded?: boolean;
}

export function Card({ className, children, as: Tag = 'div', padded = false }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-[var(--radius-card)] border border-[color:var(--c-border)] bg-[color:var(--c-surface)] shadow-xs',
        padded && 'p-4',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, actions, icon, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-[color:var(--c-border)]',
        className,
      )}
    >
      {icon && (
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--c-accent-soft)] text-[color:var(--c-accent)]">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[color:var(--c-text)] leading-tight truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[color:var(--c-text-2)] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
    </div>
  );
}

export function CardBody({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'px-4 py-2.5 border-t border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] rounded-b-[var(--radius-card)] text-xs text-[color:var(--c-text-2)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
