import { useEffect, useState } from 'react';
import { Toast } from './Toast.js';
import type { ToastItem } from './types.js';

interface Props {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}

export function ToastViewport({ items, onDismiss }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 2.5rem)' }}
    >
      {items.map((item) => (
        <Toast key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
