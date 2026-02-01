export interface ExportProgressOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Current item being processed (1-based) */
  currentItem: number;
  /** Total number of items to process */
  totalItems: number;
}

/**
 * Overlay displayed during bulk export operations
 * Shows "Exporting X of Y..." progress message with spinner
 */
export function ExportProgressOverlay({
  isVisible,
  currentItem,
  totalItems,
}: ExportProgressOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-6 py-4 flex items-center gap-3">
        {/* Spinner */}
        <div className="w-5 h-5 border-2 border-neutral-500 border-t-cyan-400 rounded-full animate-spin" />
        {/* Progress text */}
        <span className="text-neutral-200 text-sm">
          Exporting {currentItem} of {totalItems}...
        </span>
      </div>
    </div>
  );
}
