export interface ConfirmResetDialogProps {
  /** Whether the dialog is visible */
  isVisible: boolean;
  /** Callback when user confirms reset */
  onConfirm: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

/**
 * Confirmation dialog shown before resetting all markers and sections
 */
export function ConfirmResetDialog({
  isVisible,
  onConfirm,
  onCancel,
}: ConfirmResetDialogProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-6 py-5 max-w-sm">
        {/* Message */}
        <p className="text-neutral-200 text-sm mb-4">
          Reset all markers and sections? This cannot be undone.
        </p>
        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-200 border border-neutral-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm bg-red-700 hover:bg-red-600 text-white border border-red-600 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
