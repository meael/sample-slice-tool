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
  /** Start time of the current segment being played */
  segmentStart: number;
  /** End time of the current segment being played */
  segmentEnd: number;
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
  const [segmentStart, setSegmentStart] = useState(0);
  const [segmentEnd, setSegmentEnd] = useState(0);

  // Refs for Web Audio API nodes and state tracking
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Fade-out duration in seconds
  const FADE_DURATION = 0.2; // 200ms

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
   * Fade out and clean up the current playback (for smooth transitions)
   * Returns immediately - the fade happens asynchronously
   */
  const fadeOutCurrentPlayback = useCallback(() => {
    const audioContext = audioContextRef.current;
    const sourceNode = sourceNodeRef.current;
    const gainNode = gainNodeRef.current;

    if (!audioContext || !sourceNode || !gainNode) return;

    // Capture references for the closure
    const fadingSource = sourceNode;
    const fadingGain = gainNode;

    // Clear our refs immediately so new playback can start fresh
    sourceNodeRef.current = null;
    gainNodeRef.current = null;

    // Schedule the fade-out using linearRampToValueAtTime
    const now = audioContext.currentTime;
    fadingGain.gain.cancelScheduledValues(now);
    fadingGain.gain.setValueAtTime(fadingGain.gain.value, now);
    fadingGain.gain.linearRampToValueAtTime(0, now + FADE_DURATION);

    // Schedule cleanup after fade completes
    setTimeout(() => {
      try {
        fadingSource.stop();
      } catch {
        // Ignore if already stopped
      }
      fadingSource.disconnect();
      fadingGain.disconnect();
    }, FADE_DURATION * 1000 + 50); // Add small buffer for safety
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

      // If currently playing, fade out the old audio (smooth transition)
      // Otherwise, just clean up any stale nodes
      if (isPlayingRef.current && sourceNodeRef.current) {
        fadeOutCurrentPlayback();
      } else {
        cleanupSourceNode();
      }
      cancelTimeUpdate();

      // Create new source node
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;

      // Always create a new gain node for each playback
      // This allows concurrent fade-out of old audio while new audio plays
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Start at full volume
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);

      // Connect source to gain
      sourceNode.connect(gainNode);

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
      setSegmentStart(startTime);
      setSegmentEnd(endTime);
      startTimeUpdate();
    },
    [audioBuffer, getAudioContext, cleanupSourceNode, cancelTimeUpdate, startTimeUpdate, stopInternal, fadeOutCurrentPlayback]
  );

  /**
   * Stop playback completely
   */
  const stop = useCallback(() => {
    stopInternal();
    setState('idle');
    setCurrentTime(0);
    setSegmentStart(0);
    setSegmentEnd(0);
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

    // Create new gain node for this playback
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    sourceNode.connect(gainNode);

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
    segmentStart,
    segmentEnd,
    playSegment,
    stop,
    pause,
    resume,
  };
}
