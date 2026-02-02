import { UndoRedoButtons } from './UndoRedoButtons';
import { ExportAllButton, type ExportAllFormat } from './ExportAllButton';

export interface EditorToolbarProps {
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Callback for undo action */
  onUndo: () => void;
  /** Callback for redo action */
  onRedo: () => void;
  /** Callback for reset action */
  onReset: () => void;
  /** Callback for export all action */
  onExportAll: (format: ExportAllFormat) => void;
  /** Whether there are any markers */
  hasMarkers: boolean;
  /** Whether there are any sections (for Export All visibility) */
  hasSections: boolean;
  /** Whether controls should be disabled (e.g., during playback) */
  disabled?: boolean;
}

/**
 * Context-aware toolbar that displays editing controls above the waveform.
 * Controls only appear when markers exist. Fixed height to prevent layout shifts.
 */
export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onExportAll,
  hasMarkers,
  hasSections,
  disabled = false,
}: EditorToolbarProps) {
  return (
    <div className="h-10 flex justify-center items-center">
      {hasMarkers && (
        <div className="flex items-center gap-2">
          <UndoRedoButtons
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
            onReset={onReset}
            disabled={disabled}
            hasMarkers={hasMarkers}
          />
          {hasSections && <ExportAllButton onExportAll={onExportAll} />}
        </div>
      )}
    </div>
  );
}
