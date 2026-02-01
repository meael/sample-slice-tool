import type { Marker } from '../types/marker';
import type { VisibleRange } from '../types/zoom';

export interface MarkerControlStripProps {
  /** Array of markers to display controls for */
  markers: Marker[];
  /** Width of the container in pixels */
  containerWidth: number;
  /** Visible time range for positioning markers */
  visibleRange?: VisibleRange;
  /** Total audio duration in seconds */
  duration: number;
  /** Callback when user clicks to delete a marker */
  onDeleteMarker?: (markerId: string) => void;
}

/**
 * Control strip component that renders above the waveform
 * Displays marker controls (close icons, number badges) without obscuring the waveform
 */
export function MarkerControlStrip({
  markers,
  containerWidth,
  visibleRange,
  duration,
  onDeleteMarker,
}: MarkerControlStripProps) {
  /**
   * Calculate the pixel X position of a marker
   */
  const getMarkerPixelX = (time: number): number => {
    if (containerWidth === 0) return 0;

    const rangeStart = visibleRange?.start ?? 0;
    const rangeEnd = visibleRange?.end ?? duration;
    const rangeDuration = rangeEnd - rangeStart;

    const fraction = (time - rangeStart) / rangeDuration;
    return fraction * containerWidth;
  };

  /**
   * Check if a marker is within the visible range
   */
  const isMarkerVisible = (time: number): boolean => {
    const rangeStart = visibleRange?.start ?? 0;
    const rangeEnd = visibleRange?.end ?? duration;
    return time >= rangeStart && time <= rangeEnd;
  };

  return (
    <div
      className="relative w-full"
      style={{
        height: 28,
        backgroundColor: '#111',
        borderBottom: '1px solid #333',
      }}
    >
      {/* Marker controls will be rendered here in future stories */}
      {markers.map((marker) => {
        if (!isMarkerVisible(marker.time)) return null;
        const pixelX = getMarkerPixelX(marker.time);
        return (
          <div
            key={`marker-control-${marker.id}`}
            className="absolute"
            style={{
              left: pixelX,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Close icon */}
            <div
              className="flex items-center justify-center w-4 h-4 rounded-full bg-neutral-700 text-neutral-300 text-xs leading-none select-none cursor-pointer transition-colors hover:bg-neutral-600 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteMarker) {
                  onDeleteMarker(marker.id);
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              ×
            </div>
          </div>
        );
      })}
    </div>
  );
}
