import { useCallback, useEffect } from 'react';
import type { Section } from '../types/section';
import type { PlaybackState } from './usePlayback';

export interface UseKeyboardControlsOptions {
  sections: Section[];
  playbackState: PlaybackState;
  onPlaySegment: (startTime: number, endTime: number) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
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
 * - Keys 1-9 play the corresponding section
 * - Key N plays section N (sections[N-1])
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

      // Check for number keys 1-9
      if (key >= '1' && key <= '9') {
        const keyNumber = parseInt(key, 10); // 1-9
        const sectionIndex = keyNumber - 1; // 0-8

        // Check if section exists
        if (sectionIndex >= sections.length) {
          // No corresponding section, ignore
          return;
        }

        const section = sections[sectionIndex];

        // Prevent default behavior for number keys
        event.preventDefault();

        onPlaySegment(section.startTime, section.endTime);
      }
    },
    [sections, playbackState, onPlaySegment, onPause, onResume, onStop]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
