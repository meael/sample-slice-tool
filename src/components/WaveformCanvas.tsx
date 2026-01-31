import { useRef, useEffect, useCallback, useState } from 'react';
import type { WaveformPeaks } from '../types/waveform';
import type { VisibleRange } from '../types/zoom';
import type { Marker } from '../types/marker';
import { ContextMenu } from './ContextMenu';

/** Hit detection threshold in pixels for selecting markers */
const MARKER_HIT_THRESHOLD = 10;

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
  /** Callback when user clicks to add a marker at a time position */
  onAddMarker?: (time: number) => void;
  /** Array of markers to render on the waveform */
  markers?: Marker[];
  /** Color for marker lines */
  markerColor?: string;
  /** Currently selected marker ID */
  selectedMarkerId?: string | null;
  /** Color for selected marker */
  selectedMarkerColor?: string;
  /** Callback when user clicks to select a marker (or deselect with null) */
  onSelectMarker?: (markerId: string | null) => void;
  /** Callback when user drags a marker to update its position */
  onUpdateMarker?: (markerId: string, time: number) => void;
  /** Callback when user deletes the selected marker */
  onDeleteMarker?: (markerId: string) => void;
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
  onAddMarker,
  markers = [],
  markerColor = '#f97316', // orange-500
  selectedMarkerId = null,
  selectedMarkerColor = '#fbbf24', // amber-400
  onSelectMarker,
  onUpdateMarker,
  onDeleteMarker,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state for panning
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPanRef = useRef(0);
  // Track if mouse moved significantly during drag (to distinguish click from drag)
  const hasDraggedRef = useRef(false);
  const CLICK_THRESHOLD = 5; // pixels - movement below this is considered a click

  // Marker drag state
  const isDraggingMarkerRef = useRef(false);
  const draggingMarkerIdRef = useRef<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    markerId: string;
  } | null>(null);

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

    // Draw markers
    const rangeStart = visibleRange?.start ?? 0;
    const rangeEnd = visibleRange?.end ?? duration;
    const rangeDuration = rangeEnd - rangeStart;

    for (const marker of markers) {
      // Check if marker is within visible range
      if (marker.time >= rangeStart && marker.time <= rangeEnd) {
        // Convert marker time to pixel position
        const fraction = (marker.time - rangeStart) / rangeDuration;
        const x = Math.round(fraction * width);

        // Use different style for selected marker
        const isSelected = marker.id === selectedMarkerId;
        ctx.strokeStyle = isSelected ? selectedMarkerColor : markerColor;
        ctx.lineWidth = isSelected ? 2 : 1;

        // Draw vertical line spanning full waveform height
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
    }
  }, [peaks, visibleRange, height, waveformColor, backgroundColor, markers, markerColor, selectedMarkerId, selectedMarkerColor]);

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
   * Convert a time position to pixel X position
   */
  const timeToPixel = useCallback(
    (time: number): number => {
      const container = containerRef.current;
      if (!container) return 0;

      const rect = container.getBoundingClientRect();
      const rangeStart = visibleRange?.start ?? 0;
      const rangeEnd = visibleRange?.end ?? peaks.duration;
      const rangeDuration = rangeEnd - rangeStart;

      const fraction = (time - rangeStart) / rangeDuration;
      return rect.left + fraction * rect.width;
    },
    [visibleRange, peaks.duration]
  );

  /**
   * Find the nearest marker to a pixel X position within the hit threshold
   * Returns the marker ID or null if none found
   */
  const findMarkerAtPixel = useCallback(
    (pixelX: number): string | null => {
      let nearestMarkerId: string | null = null;
      let nearestDistance = MARKER_HIT_THRESHOLD;

      for (const marker of markers) {
        const markerPixelX = timeToPixel(marker.time);
        const distance = Math.abs(pixelX - markerPixelX);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestMarkerId = marker.id;
        }
      }

      return nearestMarkerId;
    },
    [markers, timeToPixel]
  );

  /**
   * Handle mouse down for drag-to-pan, marker drag, or click-to-add-marker
   */
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      // Check if clicking on a selected marker to start dragging it
      const clickedMarkerId = findMarkerAtPixel(event.clientX);

      if (clickedMarkerId && clickedMarkerId === selectedMarkerId && onUpdateMarker) {
        // Start dragging the selected marker
        isDraggingMarkerRef.current = true;
        draggingMarkerIdRef.current = clickedMarkerId;
        hasDraggedRef.current = false;
        dragStartXRef.current = event.clientX;

        // Change cursor to indicate drag mode
        if (containerRef.current) {
          containerRef.current.style.cursor = 'ew-resize';
        }
      } else {
        // Normal pan/click behavior
        isDraggingRef.current = true;
        dragStartXRef.current = event.clientX;
        dragStartPanRef.current = panOffset;
        hasDraggedRef.current = false;

        // Change cursor to grabbing if pan is enabled
        if (onPan && containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }
      }
    },
    [onPan, panOffset, findMarkerAtPixel, selectedMarkerId, onUpdateMarker]
  );

  /**
   * Handle mouse move for drag-to-pan or marker dragging
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      // Handle marker dragging
      if (isDraggingMarkerRef.current && draggingMarkerIdRef.current && onUpdateMarker) {
        const deltaX = event.clientX - dragStartXRef.current;

        // Check if we've moved beyond the click threshold
        if (Math.abs(deltaX) > CLICK_THRESHOLD) {
          hasDraggedRef.current = true;
        }

        if (hasDraggedRef.current) {
          // Calculate new marker time from current mouse position
          const newTime = pixelToTime(event.clientX);
          // Clamp to valid range (0 to duration)
          const clampedTime = Math.max(0, Math.min(newTime, peaks.duration));
          onUpdateMarker(draggingMarkerIdRef.current, clampedTime);
        }
        return;
      }

      // Handle pan dragging
      if (!isDraggingRef.current) return;

      const deltaX = dragStartXRef.current - event.clientX;

      // Check if we've moved beyond the click threshold
      if (Math.abs(deltaX) > CLICK_THRESHOLD) {
        hasDraggedRef.current = true;
      }

      // Only pan if we have the callback
      if (onPan && hasDraggedRef.current) {
        const deltaTime = pixelDistanceToTime(deltaX);
        const newPan = dragStartPanRef.current + deltaTime;
        onPan(newPan);
      }
    },
    [onPan, pixelDistanceToTime, onUpdateMarker, pixelToTime, peaks.duration]
  );

  /**
   * Handle mouse up to end drag, select marker, or add marker on click
   */
  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      // Handle end of marker drag
      if (isDraggingMarkerRef.current) {
        isDraggingMarkerRef.current = false;
        draggingMarkerIdRef.current = null;
        hasDraggedRef.current = false;

        // Restore cursor
        if (containerRef.current) {
          containerRef.current.style.cursor = onPan ? 'grab' : 'default';
        }
        return;
      }

      if (isDraggingRef.current) {
        // If we didn't drag (just clicked), check for marker selection or add a new marker
        if (!hasDraggedRef.current) {
          // First, check if we clicked near an existing marker
          const clickedMarkerId = findMarkerAtPixel(event.clientX);

          if (clickedMarkerId) {
            // Select the clicked marker
            if (onSelectMarker) {
              onSelectMarker(clickedMarkerId);
            }
          } else if (selectedMarkerId && onSelectMarker) {
            // Clicked empty area - deselect current marker
            onSelectMarker(null);
          } else if (onAddMarker) {
            // No marker nearby and none selected - add a new marker
            const time = pixelToTime(event.clientX);
            // Clamp time to valid range (0 to duration)
            const clampedTime = Math.max(0, Math.min(time, peaks.duration));
            onAddMarker(clampedTime);
          }
        }

        isDraggingRef.current = false;
        hasDraggedRef.current = false;

        // Restore cursor if pan is enabled
        if (onPan && containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
      }
    },
    [onAddMarker, onPan, pixelToTime, peaks.duration, findMarkerAtPixel, onSelectMarker, selectedMarkerId]
  );

  // Set up global mouse move/up listeners for dragging and click detection
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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

  /**
   * Handle keyboard events for marker deletion
   * Delete or Backspace key removes the selected marker
   */
  useEffect(() => {
    if (!onDeleteMarker || !selectedMarkerId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Prevent default browser behavior (e.g., navigating back on Backspace)
        event.preventDefault();
        onDeleteMarker(selectedMarkerId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDeleteMarker, selectedMarkerId]);

  /**
   * Handle right-click (context menu) on markers
   * Shows a context menu with Delete option when right-clicking on a marker
   */
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      const clickedMarkerId = findMarkerAtPixel(event.clientX);

      if (clickedMarkerId) {
        // Prevent native context menu
        event.preventDefault();

        // Show custom context menu
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          markerId: clickedMarkerId,
        });

        // Also select the marker
        if (onSelectMarker) {
          onSelectMarker(clickedMarkerId);
        }
      }
    },
    [findMarkerAtPixel, onSelectMarker]
  );

  /**
   * Handle closing the context menu
   */
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  /**
   * Handle delete from context menu
   */
  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu && onDeleteMarker) {
      onDeleteMarker(contextMenu.markerId);
    }
    setContextMenu(null);
  }, [contextMenu, onDeleteMarker]);

  return (
    <>
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center"
        style={{ cursor: onPan ? 'grab' : 'default' }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        <canvas
          ref={canvasRef}
          className="block"
        />
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[{ label: 'Delete', onClick: handleContextMenuDelete }]}
          onClose={handleCloseContextMenu}
        />
      )}
    </>
  );
}
