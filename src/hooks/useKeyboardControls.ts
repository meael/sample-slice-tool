import { useCallback, useEffect } from 'react';
import type { Marker } from '../types/marker';
import type { PlaybackState } from './usePlayback';

export interface UseKeyboardControlsOptions {
  markers: Marker[];
  duration: number;
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
 * - Keys 1-9 play the corresponding marker segment
 * - Key N plays segment from marker N-1 to marker N (or end of audio)
 * - Spacebar pauses/resumes playback
 * - Escape stops playback and resets to idle
 * - Ignores key events when input/textarea is focused
 */
export function useKeyboardControls({
  markers,
  duration,
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
        const markerIndex = keyNumber - 1; // 0-8

        // Check if we have enough markers
        // Key N plays segment from marker N-1 to marker N
        // So key 1 plays from start (0) or marker[0] to marker[0] or marker[1]
        // Actually per spec: "Key 1 plays segment from marker 0 to marker 1 (or end)"
        // This means key 1 requires marker[0] to exist, plays from marker[0].time to marker[1].time (or end)

        if (markerIndex >= markers.length) {
          // No corresponding marker, ignore
          return;
        }

        // Calculate segment boundaries
        const startTime = markers[markerIndex].time;
        const endTime = markers[markerIndex + 1]?.time ?? duration;

        // Prevent default behavior for number keys
        event.preventDefault();

        onPlaySegment(startTime, endTime);
      }
    },
    [markers, duration, playbackState, onPlaySegment, onPause, onResume, onStop]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
