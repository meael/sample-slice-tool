/**
 * State for export progress tracking
 */
export interface ExportProgressState {
  /** Whether an export operation is in progress */
  isExporting: boolean;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current item being exported (1-based) */
  currentItem: number;
  /** Total number of items to export */
  totalItems: number;
}

/**
 * Actions available for export progress management
 */
export interface ExportProgressActions {
  /** Start an export operation with the specified total item count */
  startExport: (totalItems: number) => void;
  /** Update the progress with current item and percentage */
  updateProgress: (currentItem: number, progress: number) => void;
  /** Mark the export operation as complete */
  completeExport: () => void;
}
