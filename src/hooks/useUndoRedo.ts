import { useCallback, useState } from 'react';

/**
 * State shape for the undo/redo system
 */
interface UndoRedoState<T> {
  /** Current state value */
  present: T;
  /** Stack of previous states (most recent at end) */
  past: T[];
  /** Stack of undone states (most recent at end) */
  future: T[];
}

/**
 * Return type for the useUndoRedo hook
 */
export interface UndoRedoResult<T> {
  /** Current state value */
  state: T;
  /** Update state (pushes current to history) */
  setState: (newState: T | ((prev: T) => T)) => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Move back one step in history */
  undo: () => void;
  /** Move forward one step in history */
  redo: () => void;
  /** Clear all history (past and future) */
  clearHistory: () => void;
}

/**
 * Default maximum number of history entries
 */
const DEFAULT_MAX_HISTORY = 50;

/**
 * Generic hook that wraps state with undo/redo capability
 *
 * @param initialState - The initial state value
 * @param maxHistory - Maximum number of history entries (default: 50)
 * @returns State value and undo/redo operations
 *
 * @example
 * const { state, setState, canUndo, canRedo, undo, redo } = useUndoRedo<string[]>([]);
 *
 * // Update state (creates history entry)
 * setState(['item1']);
 *
 * // Undo the change
 * if (canUndo) undo();
 *
 * // Redo the change
 * if (canRedo) redo();
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory: number = DEFAULT_MAX_HISTORY
): UndoRedoResult<T> {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    present: initialState,
    past: [],
    future: [],
  });

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      setHistory((prev) => {
        const resolvedState =
          typeof newState === 'function'
            ? (newState as (prev: T) => T)(prev.present)
            : newState;

        // Don't create history entry if state hasn't changed
        if (resolvedState === prev.present) {
          return prev;
        }

        // Push current state to past, limit history size
        const newPast = [...prev.past, prev.present].slice(-maxHistory);

        return {
          present: resolvedState,
          past: newPast,
          future: [], // Clear future on new action
        };
      });
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) {
        return prev;
      }

      const newPast = prev.past.slice(0, -1);
      const previousState = prev.past[prev.past.length - 1];

      return {
        present: previousState,
        past: newPast,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) {
        return prev;
      }

      const nextState = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        present: nextState,
        past: [...prev.past, prev.present],
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((prev) => ({
      present: prev.present,
      past: [],
      future: [],
    }));
  }, []);

  return {
    state: history.present,
    setState,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    clearHistory,
  };
}
