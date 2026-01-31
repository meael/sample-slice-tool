import { useRef, useEffect, useCallback } from 'react';
import type { WaveformPeaks } from '../types/waveform';
import type { VisibleRange } from '../types/zoom';

export interface WaveformCanvasProps {
  /** Waveform peak data to render */
  peaks: WaveformPeaks;
  /** Visible time range for rendering (optional, defaults to full waveform) */
  visibleRange?: VisibleRange;
  /** Height of the canvas in pixels */
  height?: number;
  /** Waveform color */
  waveformColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Callback when user wants to zoom at a specific time position */
  onZoomAtPoint?: (time: number, direction: 'in' | 'out') => void;
  /** Callback when user pans horizontally */
  onPan?: (offset: number) => void;
  /** Current pan offset (in seconds) - needed for pan calculations */
  panOffset?: number;
}

/**
 * Canvas component for rendering audio waveform
 * Renders peak data as a centered waveform with high contrast colors
 */
export function WaveformCanvas({
  peaks,
  visibleRange,
  height = 200,
  waveformColor = '#22d3ee', // cyan-400
  backgroundColor = '#262626', // neutral-800
  onZoomAtPoint,
  onPan,
  panOffset = 0,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state for panning
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPanRef = useRef(0);

  /**
   * Draw the waveform on the canvas
   */
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get container dimensions
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const canvasHeight = height;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, canvasHeight);

    // Calculate which peaks to render based on visible range
    const { peaks: peakData, duration } = peaks;
    const totalPeaks = peakData.length;

    let startPeakIndex = 0;
    let endPeakIndex = totalPeaks;

    if (visibleRange) {
      const peaksPerSecond = totalPeaks / duration;
      startPeakIndex = Math.floor(visibleRange.start * peaksPerSecond);
      endPeakIndex = Math.ceil(visibleRange.end * peaksPerSecond);
    }

    // Clamp indices
    startPeakIndex = Math.max(0, startPeakIndex);
    endPeakIndex = Math.min(totalPeaks, endPeakIndex);

    const visiblePeakCount = endPeakIndex - startPeakIndex;
    if (visiblePeakCount <= 0) return;

    // Calculate how many peaks per pixel
    const peaksPerPixel = visiblePeakCount / width;

    // Draw waveform
    ctx.fillStyle = waveformColor;
    const centerY = canvasHeight / 2;
    const maxAmplitude = canvasHeight / 2 - 2; // Leave 2px margin

    if (peaksPerPixel <= 1) {
      // More pixels than peaks - draw individual bars
      const pixelsPerPeak = width / visiblePeakCount;

      for (let i = 0; i < visiblePeakCount; i++) {
        const peakIndex = startPeakIndex + i;
        const peakValue = peakData[peakIndex];
        const x = i * pixelsPerPeak;

        // Draw symmetric waveform (mirrored above and below center)
        const barHeight = Math.abs(peakValue) * maxAmplitude;
        const barWidth = Math.max(1, pixelsPerPeak - 1);

        // Draw bar from center, extending both up and down
        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
      }
    } else {
      // More peaks than pixels - aggregate peaks per pixel
      for (let x = 0; x < width; x++) {
        const startPeak = startPeakIndex + Math.floor(x * peaksPerPixel);
        const endPeak = startPeakIndex + Math.floor((x + 1) * peaksPerPixel);

        // Find max absolute value in this pixel's range
        let maxValue = 0;
        for (let i = startPeak; i < endPeak && i < endPeakIndex; i++) {
          const absValue = Math.abs(peakData[i]);
          if (absValue > maxValue) {
            maxValue = absValue;
          }
        }

        // Draw bar
        const barHeight = maxValue * maxAmplitude;
        ctx.fillRect(x, centerY - barHeight, 1, barHeight * 2);
      }
    }

    // Draw center line (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }, [peaks, visibleRange, height, waveformColor, backgroundColor]);

  // Draw on mount and when dependencies change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      drawWaveform();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

  /**
   * Convert a pixel X position to time in seconds
   */
  const pixelToTime = useCallback(
    (pixelX: number): number => {
      const container = containerRef.current;
      if (!container) return 0;

      const rect = container.getBoundingClientRect();
      const relativeX = pixelX - rect.left;
      const fraction = relativeX / rect.width;

      // Calculate time based on visible range
      const rangeStart = visibleRange?.start ?? 0;
      const rangeEnd = visibleRange?.end ?? peaks.duration;
      const rangeDuration = rangeEnd - rangeStart;

      return rangeStart + fraction * rangeDuration;
    },
    [visibleRange, peaks.duration]
  );

  /**
   * Convert a pixel distance to time duration
   */
  const pixelDistanceToTime = useCallback(
    (pixelDistance: number): number => {
      const container = containerRef.current;
      if (!container) return 0;

      const rect = container.getBoundingClientRect();
      const rangeStart = visibleRange?.start ?? 0;
      const rangeEnd = visibleRange?.end ?? peaks.duration;
      const rangeDuration = rangeEnd - rangeStart;

      return (pixelDistance / rect.width) * rangeDuration;
    },
    [visibleRange, peaks.duration]
  );

  /**
   * Handle mouse down for drag-to-pan
   */
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!onPan) return;

      isDraggingRef.current = true;
      dragStartXRef.current = event.clientX;
      dragStartPanRef.current = panOffset;

      // Change cursor to grabbing
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    },
    [onPan, panOffset]
  );

  /**
   * Handle mouse move for drag-to-pan
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDraggingRef.current || !onPan) return;

      const deltaX = dragStartXRef.current - event.clientX;
      const deltaTime = pixelDistanceToTime(deltaX);
      const newPan = dragStartPanRef.current + deltaTime;

      onPan(newPan);
    },
    [onPan, pixelDistanceToTime]
  );

  /**
   * Handle mouse up to end drag
   */
  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;

      // Restore cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    }
  }, []);

  // Set up global mouse move/up listeners for dragging
  useEffect(() => {
    if (!onPan) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onPan, handleMouseMove, handleMouseUp]);

  /**
   * Native wheel event handler for trackpad pinch/scroll zoom and horizontal pan
   * Using native event listener with passive: false to prevent default browser zoom
   * when ctrlKey is pressed (trackpad pinch gesture)
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (event: WheelEvent) => {
      // Check if this is a horizontal scroll (trackpad swipe or shift+wheel)
      const isHorizontalScroll = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);

      if (isHorizontalScroll && onPan) {
        // Horizontal pan
        event.preventDefault();

        const deltaX = event.deltaX !== 0 ? event.deltaX : event.deltaY;
        const deltaTime = pixelDistanceToTime(deltaX);
        onPan(panOffset + deltaTime);
      } else if (onZoomAtPoint) {
        // Vertical scroll = zoom
        event.preventDefault();

        // Get the time position at the cursor
        const time = pixelToTime(event.clientX);

        // Determine zoom direction
        // Wheel up (negative deltaY) = zoom in
        // Wheel down (positive deltaY) = zoom out
        // For trackpad pinch gestures, browsers set ctrlKey=true and deltaY reflects pinch direction
        const direction: 'in' | 'out' = event.deltaY < 0 ? 'in' : 'out';

        onZoomAtPoint(time, direction);
      }
    };

    // Use passive: false to allow preventDefault() for ctrlKey + wheel (browser zoom)
    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [onZoomAtPoint, onPan, pixelToTime, pixelDistanceToTime, panOffset]);

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center"
      style={{ cursor: onPan ? 'grab' : 'default' }}
      onMouseDown={handleMouseDown}
    >
      <canvas
        ref={canvasRef}
        className="block"
      />
    </div>
  );
}
