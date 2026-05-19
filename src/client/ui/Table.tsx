import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export function Table({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children?: ReactNode }) {
  return (
    <thead className="bg-[color:var(--c-surface-2)] text-[10px] uppercase tracking-wider text-[color:var(--c-text-2)]">
      {children}
    </thead>
  );
}

export function TH({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn('text-left font-medium px-3 py-2 border-b border-[color:var(--c-border)]', className)}>
      {children}
    </th>
  );
}

export function TR({ children, className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-[color:var(--c-surface-2)] border-b border-[color:var(--c-border)] last:border-0',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TD({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn('px-3 py-2 align-middle text-[color:var(--c-text)]', className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ children, colSpan }: { children?: ReactNode; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-[color:var(--c-text-3)]">
        {children}
      </td>
    </tr>
  );
}
