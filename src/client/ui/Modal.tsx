import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from './cn.js';
import { Button } from './Button.js';

interface ModalProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function Modal({ title, subtitle, onClose, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--c-overlay)' }}
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-[var(--radius-card)] shadow-2xl flex flex-col max-h-[92vh]',
          sizeMap[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="flex items-start gap-3 px-5 py-4 border-b border-[color:var(--c-border)]">
            <div className="flex-1 min-w-0">
              {title && <h2 className="text-base font-semibold text-[color:var(--c-text)]">{title}</h2>}
              {subtitle && <p className="text-xs text-[color:var(--c-text-2)] mt-1">{subtitle}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X size={16} />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] rounded-b-[var(--radius-card)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
