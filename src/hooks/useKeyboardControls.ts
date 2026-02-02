import { useCallback, useEffect } from 'react';
import type { Section } from '../types/section';
import type { PlaybackState } from './usePlayback';
import { KEY_ORDER, getIndexForKey } from '../constants/keyboardMapping';

export interface UseKeyboardControlsOptions {
  sections: Section[];
  playbackState: PlaybackState;
  onPlaySegment: (startTime: number, endTime: number) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  /** Callback when a section key is pressed on an enabled section */
  onSectionKeyPressed?: (keyboardKey: string) => void;
  /** Undo/redo callbacks */
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * Check if an element is an input or textarea (where keyboard shortcuts should be ignored)
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
}

/**
 * Hook for handling keyboard controls for audio playback
 *
 * - Keys 1-0, Q-M (36 keys) play the corresponding enabled section
 * - Key order: 1234567890qwertyuiopasdfghjklzxcvbnm
 * - Only enabled sections receive keyboard shortcuts
 * - Spacebar pauses/resumes playback
 * - Escape stops playback and resets to idle
 * - Ignores key events when input/textarea is focused
 */
export function useKeyboardControls({
  sections,
  playbackState,
  onPlaySegment,
  onPause,
  onResume,
  onStop,
  onSectionKeyPressed,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UseKeyboardControlsOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if focus is in an input element
      if (isInputElement(event.target)) return;

      const key = event.key;

      // Escape: stop playback immediately
      if (key === 'Escape') {
        if (playbackState === 'playing' || playbackState === 'paused') {
          event.preventDefault();
          onStop();
        }
        return;
      }

      // Spacebar: pause/resume
      if (key === ' ') {
        // Prevent default scrolling behavior
        event.preventDefault();

        if (playbackState === 'playing') {
          onPause();
        } else if (playbackState === 'paused') {
          onResume();
        }
        // Ignore when idle (nothing playing)
        return;
      }

      // Undo/Redo: Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z
      // Disabled during audio playback
      if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === 'z') {
        // Skip during playback
        if (playbackState === 'playing') return;

        event.preventDefault();

        if (event.shiftKey) {
          // Redo: Cmd/Ctrl+Shift+Z
          if (canRedo && onRedo) {
            onRedo();
          }
        } else {
          // Undo: Cmd/Ctrl+Z
          if (canUndo && onUndo) {
            onUndo();
          }
        }
        return;
      }

      // Check for section playback keys (1-0, Q-M)
      const keyLower = key.toLowerCase();
      if (KEY_ORDER.includes(keyLower)) {
        const sectionIndex = getIndexForKey(keyLower);

        // Filter to only enabled sections for keyboard mapping
        const enabledSections = sections.filter(s => s.enabled);

        // Check if enabled section exists at this index
        if (sectionIndex >= enabledSections.length) {
          // No corresponding enabled section, ignore
          return;
        }

        const section = enabledSections[sectionIndex];

        // Prevent default behavior for section keys
        event.preventDefault();

        // Notify about section key press (for visual feedback like blink animation)
        if (onSectionKeyPressed) {
          onSectionKeyPressed(keyLower);
        }

        onPlaySegment(section.startTime, section.endTime);
      }
    },
    [sections, playbackState, onPlaySegment, onPause, onResume, onStop, onSectionKeyPressed, canUndo, canRedo, onUndo, onRedo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
