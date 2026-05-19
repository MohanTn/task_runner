import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from './cn.js';

interface ToastProps {
  tone?: 'success' | 'error' | 'info';
  children: ReactNode;
  onDismiss?: () => void;
}

const toneMap = {
  success: {
    cls: 'bg-[color:var(--c-success-soft)] border-[color:var(--c-success)] text-[color:var(--c-success)]',
    icon: <CheckCircle2 size={16} />,
  },
  error: {
    cls: 'bg-[color:var(--c-danger-soft)] border-[color:var(--c-danger)] text-[color:var(--c-danger)]',
    icon: <AlertCircle size={16} />,
  },
  info: {
    cls: 'bg-[color:var(--c-info-soft)] border-[color:var(--c-info)] text-[color:var(--c-info)]',
    icon: <AlertCircle size={16} />,
  },
};

export function Banner({ tone = 'info', children, onDismiss }: ToastProps) {
  const { cls, icon } = toneMap[tone];
  return (
    <div
      role="alert"
      className={cn('flex items-start gap-2 px-3 py-2 rounded-md border text-sm', cls)}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 leading-snug">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="opacity-70 hover:opacity-100 shrink-0"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
