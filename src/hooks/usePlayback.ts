import { useCallback, useEffect, useRef, useState } from 'react';

export type PlaybackState = 'idle' | 'playing' | 'paused';

export interface UsePlaybackOptions {
  audioBuffer: AudioBuffer | null;
}

export interface UsePlaybackReturn {
  /** Current playback state */
  state: PlaybackState;
  /** Current playback position in seconds */
  currentTime: number;
  /** Play a segment from startTime to endTime */
  playSegment: (startTime: number, endTime: number) => void;
  /** Stop playback and reset to idle */
  stop: () => void;
  /** Pause current playback */
  pause: () => void;
  /** Resume paused playback */
  resume: () => void;
}

/**
 * Hook for managing audio segment playback using Web Audio API
 *
 * Uses AudioBufferSourceNode for precise segment playback with
 * support for pause/resume functionality.
 */
export function usePlayback({ audioBuffer }: UsePlaybackOptions): UsePlaybackReturn {
  const [state, setState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);

  // Refs for Web Audio API nodes and state tracking
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Playback tracking refs
  const segmentStartTimeRef = useRef(0);
  const segmentEndTimeRef = useRef(0);
  const playbackStartTimestampRef = useRef(0);
  const pausedAtRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  // Track the current audioBuffer to detect changes
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Ref to hold the tick function for self-reference in animation loop
  const tickRef = useRef<() => void>(() => {});

  // Ref to hold cleanup function
  const cleanupSourceNodeRef = useRef<() => void>(() => {});

  /**
   * Get or create the AudioContext
   */
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Stop and clean up the current source node
   */
  const cleanupSourceNode = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
  }, []);

  /**
   * Cancel the animation frame for time updates
   */
  const cancelTimeUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // Update refs in effects to satisfy ESLint rules
  useEffect(() => {
    cleanupSourceNodeRef.current = cleanupSourceNode;
  }, [cleanupSourceNode]);

  // Set up the tick function in an effect
  useEffect(() => {
    tickRef.current = () => {
      if (!isPlayingRef.current) return;

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      const elapsed = audioContext.currentTime - playbackStartTimestampRef.current;
      const newCurrentTime = segmentStartTimeRef.current + elapsed;

      // Check if we've reached the end of the segment
      if (newCurrentTime >= segmentEndTimeRef.current) {
        setCurrentTime(segmentEndTimeRef.current);
        setState('idle');
        isPlayingRef.current = false;
        cleanupSourceNodeRef.current();
        return;
      }

      setCurrentTime(newCurrentTime);
      animationFrameRef.current = requestAnimationFrame(tickRef.current);
    };
  }, []);

  /**
   * Start the time update loop
   */
  const startTimeUpdate = useCallback(() => {
    cancelTimeUpdate();
    isPlayingRef.current = true;
    animationFrameRef.current = requestAnimationFrame(tickRef.current);
  }, [cancelTimeUpdate]);

  /**
   * Stop playback completely (internal, doesn't set state)
   */
  const stopInternal = useCallback(() => {
    cleanupSourceNode();
    cancelTimeUpdate();
    pausedAtRef.current = 0;
  }, [cleanupSourceNode, cancelTimeUpdate]);

  /**
   * Play a segment of the audio buffer
   */
  const playSegment = useCallback(
    (startTime: number, endTime: number) => {
      if (!audioBuffer) return;

      // Check if audioBuffer changed since last operation
      if (audioBufferRef.current !== audioBuffer) {
        stopInternal();
        audioBufferRef.current = audioBuffer;
        setState('idle');
        setCurrentTime(0);
      }

      const audioContext = getAudioContext();

      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Clean up any existing playback
      cleanupSourceNode();
      cancelTimeUpdate();

      // Create new source node
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;

      // Create gain node for volume control (used for fades in US-006)
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContext.createGain();
        gainNodeRef.current.connect(audioContext.destination);
      }

      // Reset gain to full volume
      gainNodeRef.current.gain.setValueAtTime(1, audioContext.currentTime);

      // Connect source to gain
      sourceNode.connect(gainNodeRef.current);

      // Store segment boundaries
      segmentStartTimeRef.current = startTime;
      segmentEndTimeRef.current = endTime;
      pausedAtRef.current = 0;

      // Calculate duration
      const duration = endTime - startTime;

      // Start playback
      sourceNode.start(0, startTime, duration);
      playbackStartTimestampRef.current = audioContext.currentTime;
      sourceNodeRef.current = sourceNode;

      // Handle natural end of playback
      sourceNode.onended = () => {
        // Only transition to idle if we're still in playing state
        // (not if we were stopped or paused)
        if (sourceNodeRef.current === sourceNode) {
          setState('idle');
          setCurrentTime(0);
          isPlayingRef.current = false;
          cleanupSourceNode();
        }
      };

      setState('playing');
      setCurrentTime(startTime);
      startTimeUpdate();
    },
    [audioBuffer, getAudioContext, cleanupSourceNode, cancelTimeUpdate, startTimeUpdate, stopInternal]
  );

  /**
   * Stop playback completely
   */
  const stop = useCallback(() => {
    stopInternal();
    setState('idle');
    setCurrentTime(0);
  }, [stopInternal]);

  /**
   * Pause current playback
   */
  const pause = useCallback(() => {
    if (!isPlayingRef.current) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // Calculate where we paused
    const elapsed = audioContext.currentTime - playbackStartTimestampRef.current;
    pausedAtRef.current = segmentStartTimeRef.current + elapsed;

    cleanupSourceNode();
    cancelTimeUpdate();
    setState('paused');
  }, [cleanupSourceNode, cancelTimeUpdate]);

  /**
   * Resume paused playback
   */
  const resume = useCallback(() => {
    if (!audioBuffer || pausedAtRef.current === 0) return;

    // Check if audioBuffer changed
    if (audioBufferRef.current !== audioBuffer) {
      audioBufferRef.current = audioBuffer;
      return; // Can't resume with a different buffer
    }

    const audioContext = getAudioContext();

    // Resume context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create new source node starting from paused position
    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain();
      gainNodeRef.current.connect(audioContext.destination);
    }

    gainNodeRef.current.gain.setValueAtTime(1, audioContext.currentTime);
    sourceNode.connect(gainNodeRef.current);

    // Calculate remaining duration
    const remainingDuration = segmentEndTimeRef.current - pausedAtRef.current;

    // Start from paused position
    sourceNode.start(0, pausedAtRef.current, remainingDuration);

    // Update tracking for time calculations
    playbackStartTimestampRef.current = audioContext.currentTime;
    segmentStartTimeRef.current = pausedAtRef.current;
    sourceNodeRef.current = sourceNode;

    // Handle natural end
    sourceNode.onended = () => {
      if (sourceNodeRef.current === sourceNode) {
        setState('idle');
        setCurrentTime(0);
        isPlayingRef.current = false;
        cleanupSourceNode();
      }
    };

    setState('playing');
    startTimeUpdate();
  }, [audioBuffer, getAudioContext, cleanupSourceNode, startTimeUpdate]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      cleanupSourceNode();
      cancelTimeUpdate();
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [cleanupSourceNode, cancelTimeUpdate]);

  return {
    state,
    currentTime,
    playSegment,
    stop,
    pause,
    resume,
  };
}
