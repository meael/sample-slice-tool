import { useEffect } from 'react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function Toast({ message, type, onDismiss, autoDismissMs = 4000 }: ToastProps) {
  // Auto-dismiss after specified time
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  const bgColor = type === 'success' ? 'bg-green-800 border-green-600' : 'bg-red-800 border-red-600';
  const textColor = type === 'success' ? 'text-green-100' : 'text-red-100';

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 border rounded shadow-lg z-50 ${bgColor} ${textColor}`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {type === 'success' ? (
          <span className="text-lg">✓</span>
        ) : (
          <span className="text-lg">✕</span>
        )}
        <span className="text-sm">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-2 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
