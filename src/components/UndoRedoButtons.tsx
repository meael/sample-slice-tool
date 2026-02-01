export interface UndoRedoButtonsProps {
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
  /** Whether buttons should be disabled (e.g., during playback) */
  disabled?: boolean;
}

/**
 * Undo, redo, and reset buttons for marker operations
 */
export function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  disabled = false,
}: UndoRedoButtonsProps) {
  const baseButtonClass =
    'px-2 py-1.5 text-xs bg-neutral-800 border border-neutral-700 transition-colors';
  const enabledClass = 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700';
  const disabledClass = 'text-neutral-600 cursor-not-allowed';

  return (
    <div className="flex items-center gap-1">
      {/* Undo button */}
      <button
        type="button"
        onClick={onUndo}
        disabled={disabled || !canUndo}
        className={`${baseButtonClass} ${disabled || !canUndo ? disabledClass : enabledClass}`}
        title="Undo (Cmd/Ctrl+Z)"
        aria-label="Undo"
      >
        <span aria-hidden="true">↶</span>
      </button>

      {/* Redo button */}
      <button
        type="button"
        onClick={onRedo}
        disabled={disabled || !canRedo}
        className={`${baseButtonClass} ${disabled || !canRedo ? disabledClass : enabledClass}`}
        title="Redo (Cmd/Ctrl+Shift+Z)"
        aria-label="Redo"
      >
        <span aria-hidden="true">↷</span>
      </button>

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        disabled={disabled}
        className={`${baseButtonClass} ${disabled ? disabledClass : enabledClass} ml-1`}
        title="Reset all markers"
        aria-label="Reset"
      >
        <span aria-hidden="true">⟲</span>
      </button>
    </div>
  );
}
