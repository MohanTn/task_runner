export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  dedupeKey?: string;
}

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  duration: number;
  dedupeKey?: string;
}
