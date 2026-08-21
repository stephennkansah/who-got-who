import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toast: ToastItem) => void;

let nextId = 1;
let listener: Listener | null = null;
let queued: ToastItem[] = [];

/** Show an in-app toast from anywhere (replaces native alert()). */
export function showToast(message: string, type: ToastType = 'info') {
  const toast = { id: nextId++, message, type };
  if (listener) {
    listener(toast);
  } else {
    queued.push(toast);
  }
}

const TOAST_DURATION = 3800;
const MAX_VISIBLE = 3;

/** Mount once at the app root. Renders and auto-dismisses toasts. */
export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listener = (toast) => {
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, TOAST_DURATION);
    };
    if (queued.length) {
      const pending = queued;
      queued = [];
      pending.forEach((toast) => listener?.(toast));
    }
    return () => {
      listener = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
        >
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
