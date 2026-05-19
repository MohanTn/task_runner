import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../cn.js';
import type { ToastItem, ToastTone } from './types.js';

interface Props {
  item: ToastItem;
  onDismiss: (id: number) => void;
}

const TONE_CLS: Record<ToastTone, { bar: string; icon: string; accent: string }> = {
  success: {
    bar: 'bg-[color:var(--c-success)]',
    icon: 'text-[color:var(--c-success)] bg-[color:var(--c-success-soft)]',
    accent: 'border-l-[color:var(--c-success)]',
  },
  error: {
    bar: 'bg-[color:var(--c-danger)]',
    icon: 'text-[color:var(--c-danger)] bg-[color:var(--c-danger-soft)]',
    accent: 'border-l-[color:var(--c-danger)]',
  },
  warning: {
    bar: 'bg-[color:var(--c-warning)]',
    icon: 'text-[color:var(--c-warning)] bg-[color:var(--c-warning-soft)]',
    accent: 'border-l-[color:var(--c-warning)]',
  },
  info: {
    bar: 'bg-[color:var(--c-info)]',
    icon: 'text-[color:var(--c-info)] bg-[color:var(--c-info-soft)]',
    accent: 'border-l-[color:var(--c-info)]',
  },
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <CheckCircle2 size={16} />;
  if (tone === 'error') return <AlertCircle size={16} />;
  if (tone === 'warning') return <AlertTriangle size={16} />;
  return <Info size={16} />;
}

export function Toast({ item, onDismiss }: Props) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginExit = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    exitTimer.current = setTimeout(() => onDismiss(item.id), 220);
  }, [leaving, item.id, onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    dismissTimer.current = setTimeout(beginExit, item.duration);
    return () => {
      cancelAnimationFrame(raf);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [item.duration, beginExit]);

  const handleClose = useCallback(() => beginExit(), [beginExit]);

  const tone = TONE_CLS[item.tone];

  return (
    <div
      className={cn(
        'pointer-events-auto w-80 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-md border border-l-4 shadow-lg',
        'bg-[color:var(--c-surface)] border-[color:var(--c-border-2)] text-[color:var(--c-text)]',
        'transition-all duration-200 ease-out',
        tone.accent,
        entered && !leaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      )}
      role="alert"
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 items-center justify-center rounded-md shrink-0',
            tone.icon,
          )}
        >
          <ToneIcon tone={item.tone} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-tight text-[color:var(--c-text)]">
            {item.title}
          </div>
          {item.description && (
            <div className="mt-0.5 text-xs text-[color:var(--c-text-2)] leading-snug">
              {item.description}
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          aria-label="Dismiss"
          className="shrink-0 h-6 w-6 inline-flex items-center justify-center rounded text-[color:var(--c-text-3)] hover:text-[color:var(--c-text)] hover:bg-[color:var(--c-surface-2)] transition-colors"
        >
          <X size={13} />
        </button>
      </div>
      <div className="h-0.5 bg-[color:var(--c-surface-2)] overflow-hidden">
        <div
          className={cn('h-full origin-left', tone.bar)}
          style={{
            animation: `toast-progress ${item.duration}ms linear forwards`,
          }}
        />
      </div>
      <style>
        {`@keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}
      </style>
    </div>
  );
}
