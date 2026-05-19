import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-[color:var(--c-text)] leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[color:var(--c-text-2)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--c-text-2)]">
        {children}
      </h2>
      {action}
    </div>
  );
}
