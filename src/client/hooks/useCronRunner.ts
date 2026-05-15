import { useState, useEffect, useRef, useCallback } from 'react';
import type { Cron } from '../types/crons.js';
import type { Job } from '../types/jobs.js';

export interface JobRunState {
  running: boolean;
  lastRun: Date | null;
}

export type RunningMap = Record<number, JobRunState>;

function matchField(field: string, value: number): boolean {
  if (field === '*') return true;
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2), 10);
    return !isNaN(step) && value % step === 0;
  }
  if (field.includes('-')) {
    const [lo, hi] = field.split('-').map(Number);
    return value >= lo && value <= hi;
  }
  if (field.includes(',')) return field.split(',').some((f) => matchField(f, value));
  const parsed = parseInt(field, 10);
  return !isNaN(parsed) && parsed === value;
}

export function cronMatchesNow(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const now = new Date();
  const [min, hour, dom, month, dow] = parts;
  return (
    matchField(min, now.getMinutes()) &&
    matchField(hour, now.getHours()) &&
    matchField(dom, now.getDate()) &&
    matchField(month, now.getMonth() + 1) &&
    matchField(dow, now.getDay())
  );
}

export function getNextRunLabel(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid expression';
  const now = new Date();
  for (let m = 1; m <= 1440; m++) {
    const t = new Date(now.getTime() + m * 60_000);
    const [min, hour, dom, month, dow] = parts;
    const matches =
      matchField(min, t.getMinutes()) &&
      matchField(hour, t.getHours()) &&
      matchField(dom, t.getDate()) &&
      matchField(month, t.getMonth() + 1) &&
      matchField(dow, t.getDay());
    if (matches) {
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return m < 60 ? `${timeStr} (in ${m}m)` : `${timeStr} (in ~${Math.round(m / 60)}h)`;
    }
  }
  return 'More than 24h away';
}

interface UseCronRunnerOptions {
  crons: Cron[];
  jobs: Job[];
  enabled: boolean;
}

const JOB_RUN_DURATION_MS = 2_000;

export function useCronRunner({ crons, jobs, enabled }: UseCronRunnerOptions): RunningMap {
  const [runningMap, setRunningMap] = useState<RunningMap>({});
  const lastMinuteRef = useRef<number>(-1);
  const resetTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const scheduleReset = useCallback((id: number) => {
    const existing = resetTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setRunningMap((prev) => {
        if (!prev[id]) return prev;
        return { ...prev, [id]: { ...prev[id], running: false } };
      });
      resetTimers.current.delete(id);
    }, JOB_RUN_DURATION_MS);
    resetTimers.current.set(id, timer);
  }, []);

  const triggerJobs = useCallback((jobIds: number[]) => {
    const now = new Date();
    setRunningMap((prev) => {
      const next = { ...prev };
      for (const id of jobIds) next[id] = { running: true, lastRun: now };
      return next;
    });
    for (const id of jobIds) scheduleReset(id);
    console.log('[CronRunner] triggered jobs:', jobIds); // intentional simulation log
  }, [scheduleReset]);

  useEffect(() => {
    if (!enabled) return undefined;
    const intervalId = setInterval(() => {
      const now = new Date();
      if (now.getSeconds() !== 0) return;
      if (now.getMinutes() === lastMinuteRef.current) return;
      lastMinuteRef.current = now.getMinutes();

      const toRun = new Set<number>();
      for (const cron of crons) {
        if (!cron.enabled || !cronMatchesNow(cron.expression)) continue;
        for (const jobId of cron.job_ids) {
          if (jobs.some((j) => j.id === jobId && j.enabled)) toRun.add(jobId);
        }
      }
      if (toRun.size > 0) triggerJobs([...toRun]);
    }, 1_000);
    return () => clearInterval(intervalId);
  }, [enabled, crons, jobs, triggerJobs]);

  useEffect(() => {
    const timers = resetTimers.current;
    return () => { for (const t of timers.values()) clearTimeout(t); };
  }, []);

  return runningMap;
}
