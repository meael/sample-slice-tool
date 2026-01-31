import { useCallback, useMemo, useState } from 'react';
import type { VisibleRange, ZoomActions, ZoomOptions, ZoomState } from '../types/zoom';

const DEFAULT_MIN_ZOOM = 1;
const DEFAULT_MAX_ZOOM = 100;
const DEFAULT_ZOOM_STEP = 1.5;

/**
 * Hook for managing zoom level and pan position for the waveform view
 *
 * Provides zoom in/out operations, zoom at a specific point (for cursor-centered zoom),
 * and horizontal pan control with proper boundary clamping.
 */
export function useZoom(options: ZoomOptions): ZoomState & ZoomActions & { visibleRange: VisibleRange } {
  const {
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    zoomStep = DEFAULT_ZOOM_STEP,
    duration,
  } = options;

  const [zoomLevel, setZoomLevelState] = useState<number>(minZoom);
  const [panOffset, setPanOffsetState] = useState<number>(0);

  /**
   * Clamp zoom level within min/max bounds
   */
  const clampZoom = useCallback(
    (level: number): number => {
      return Math.max(minZoom, Math.min(maxZoom, level));
    },
    [minZoom, maxZoom]
  );

  /**
   * Get the visible duration at the current zoom level
   */
  const getVisibleDuration = useCallback(
    (zoom: number): number => {
      return duration / zoom;
    },
    [duration]
  );

  /**
   * Clamp pan offset to ensure we don't scroll beyond waveform boundaries
   */
  const clampPan = useCallback(
    (offset: number, zoom: number): number => {
      const visibleDuration = getVisibleDuration(zoom);
      const maxPan = Math.max(0, duration - visibleDuration);
      return Math.max(0, Math.min(maxPan, offset));
    },
    [duration, getVisibleDuration]
  );

  /**
   * Calculate the visible time range based on current zoom and pan state
   */
  const visibleRange = useMemo((): VisibleRange => {
    const visibleDuration = getVisibleDuration(zoomLevel);
    const start = panOffset;
    const end = Math.min(panOffset + visibleDuration, duration);
    return {
      start,
      end,
      duration: end - start,
    };
  }, [zoomLevel, panOffset, duration, getVisibleDuration]);

  /**
   * Zoom in by one step
   */
  const zoomIn = useCallback((): void => {
    setZoomLevelState((prev) => {
      const newZoom = clampZoom(prev * zoomStep);
      // Adjust pan to keep view centered
      const oldVisibleDuration = getVisibleDuration(prev);
      const newVisibleDuration = getVisibleDuration(newZoom);
      const centerTime = panOffset + oldVisibleDuration / 2;
      const newPan = centerTime - newVisibleDuration / 2;
      setPanOffsetState(clampPan(newPan, newZoom));
      return newZoom;
    });
  }, [clampZoom, zoomStep, panOffset, getVisibleDuration, clampPan]);

  /**
   * Zoom out by one step
   */
  const zoomOut = useCallback((): void => {
    setZoomLevelState((prev) => {
      const newZoom = clampZoom(prev / zoomStep);
      // Adjust pan to keep view centered
      const oldVisibleDuration = getVisibleDuration(prev);
      const newVisibleDuration = getVisibleDuration(newZoom);
      const centerTime = panOffset + oldVisibleDuration / 2;
      const newPan = centerTime - newVisibleDuration / 2;
      setPanOffsetState(clampPan(newPan, newZoom));
      return newZoom;
    });
  }, [clampZoom, zoomStep, panOffset, getVisibleDuration, clampPan]);

  /**
   * Zoom at a specific point (time in seconds)
   * This keeps the specified time position stable under the cursor during zoom
   */
  const zoomAtPoint = useCallback(
    (time: number, direction: 'in' | 'out'): void => {
      setZoomLevelState((prev) => {
        const newZoom = clampZoom(
          direction === 'in' ? prev * zoomStep : prev / zoomStep
        );

        // Calculate the relative position of the zoom point in the current view
        const oldVisibleDuration = getVisibleDuration(prev);
        const relativePosition = (time - panOffset) / oldVisibleDuration;

        // Calculate new pan offset to keep the same point under cursor
        const newVisibleDuration = getVisibleDuration(newZoom);
        const newPan = time - relativePosition * newVisibleDuration;

        setPanOffsetState(clampPan(newPan, newZoom));
        return newZoom;
      });
    },
    [clampZoom, zoomStep, panOffset, getVisibleDuration, clampPan]
  );

  /**
   * Set pan offset directly (with clamping)
   */
  const setPan = useCallback(
    (offset: number): void => {
      setPanOffsetState(clampPan(offset, zoomLevel));
    },
    [clampPan, zoomLevel]
  );

  /**
   * Set zoom level directly (with clamping and pan adjustment)
   */
  const setZoomLevel = useCallback(
    (level: number): void => {
      const newZoom = clampZoom(level);
      setZoomLevelState(newZoom);
      // Ensure pan is still valid at new zoom level
      setPanOffsetState((prev) => clampPan(prev, newZoom));
    },
    [clampZoom, clampPan]
  );

  /**
   * Reset zoom and pan to initial state
   */
  const reset = useCallback((): void => {
    setZoomLevelState(minZoom);
    setPanOffsetState(0);
  }, [minZoom]);

  return {
    // State
    zoomLevel,
    panOffset,
    visibleRange,
    // Actions
    zoomIn,
    zoomOut,
    zoomAtPoint,
    setPan,
    setZoomLevel,
    reset,
  };
}
