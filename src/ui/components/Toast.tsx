import { useEffect, useState } from 'preact/hooks';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

let toastId = 0;

type ToastListener = (toast: ToastMessage) => void;
const listeners: Set<ToastListener> = new Set();

export function showToast(text: string, type: ToastType = 'info'): void {
  const toast: ToastMessage = { id: ++toastId, text, type };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler: ToastListener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div class="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} class={`toast ${toast.type}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
