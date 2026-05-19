import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      onClose={onCancel}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          {danger && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--c-danger-soft)] text-[color:var(--c-danger)]">
              <AlertTriangle size={14} />
            </span>
          )}
          {title}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? 'primary' : 'primary'} onClick={onConfirm}
            className={danger ? 'bg-[color:var(--c-danger)] border-[color:var(--c-danger)] hover:brightness-110' : ''}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[color:var(--c-text-2)] leading-relaxed">{message}</p>
    </Modal>
  );
}
