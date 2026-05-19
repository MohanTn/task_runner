import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ToastViewport } from './ToastViewport.js';
import type { ToastInput, ToastItem, ToastTone } from './types.js';

interface ToastApi {
  show: (input: ToastInput) => number;
  success: (title: string, description?: string, duration?: number) => number;
  error: (title: string, description?: string, duration?: number) => number;
  warning: (title: string, description?: string, duration?: number) => number;
  info: (title: string, description?: string, duration?: number) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000,
};

const MAX_VISIBLE = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const recentRef = useRef(new Map<string, number>());

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((input: ToastInput): number => {
    const tone: ToastTone = input.tone ?? 'success';
    const dedupeKey = input.dedupeKey ?? `${tone}:${input.title}:${input.description ?? ''}`;
    const now = Date.now();
    const lastAt = recentRef.current.get(dedupeKey);
    if (lastAt && now - lastAt < 600) {
      return -1;
    }
    recentRef.current.set(dedupeKey, now);

    idRef.current += 1;
    const id = idRef.current;
    const item: ToastItem = {
      id,
      title: input.title,
      description: input.description,
      tone,
      duration: input.duration ?? DEFAULT_DURATION[tone],
      dedupeKey,
    };
    setItems((prev) => {
      const filtered = prev.filter((t) => t.dedupeKey !== dedupeKey);
      const next = [...filtered, item];
      return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
    });
    return id;
  }, []);

  const success = useCallback((title: string, description?: string, duration?: number) =>
    show({ title, description, tone: 'success', duration }), [show]);
  const error = useCallback((title: string, description?: string, duration?: number) =>
    show({ title, description, tone: 'error', duration }), [show]);
  const warning = useCallback((title: string, description?: string, duration?: number) =>
    show({ title, description, tone: 'warning', duration }), [show]);
  const info = useCallback((title: string, description?: string, duration?: number) =>
    show({ title, description, tone: 'info', duration }), [show]);

  const api = useMemo<ToastApi>(
    () => ({ show, success, error, warning, info, dismiss }),
    [show, success, error, warning, info, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
