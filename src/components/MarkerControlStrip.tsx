import type { Marker } from '../types/marker';
import type { VisibleRange } from '../types/zoom';
import type { PlaybackState } from '../hooks/usePlayback';

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
  /** Current playback state */
  playbackState?: PlaybackState;
  /** Start time of the currently playing segment */
  playbackSegmentStart?: number;
  /** End time of the currently playing segment */
  playbackSegmentEnd?: number;
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
  playbackState,
  playbackSegmentStart,
  playbackSegmentEnd,
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

  /**
   * Check if a marker's segment is currently playing
   * Segment for marker at index N starts at markers[N-1].time (or 0 if N=0)
   * and ends at markers[N].time (or duration if no next marker)
   */
  const isMarkerActive = (index: number): boolean => {
    if (playbackState !== 'playing' && playbackState !== 'paused') return false;
    if (playbackSegmentStart === undefined || playbackSegmentEnd === undefined) return false;

    // The segment for badge (index+1) starts at markers[index].time
    const segmentStart = markers[index].time;
    const segmentEnd = index + 1 < markers.length ? markers[index + 1].time : duration;

    // Check if current playback segment matches this marker's segment
    // Use small epsilon for floating point comparison
    const epsilon = 0.001;
    return (
      Math.abs(playbackSegmentStart - segmentStart) < epsilon &&
      Math.abs(playbackSegmentEnd - segmentEnd) < epsilon
    );
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
      {markers.map((marker, index) => {
        if (!isMarkerVisible(marker.time)) return null;
        const pixelX = getMarkerPixelX(marker.time);
        // Number badge: 1-9 for first 9 markers, null for the rest
        const badgeNumber = index < 9 ? index + 1 : null;
        return (
          <div
            key={`marker-control-${marker.id}`}
            className="absolute flex items-center gap-1"
            style={{
              left: pixelX,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Section name */}
            <div
              className="text-neutral-300 select-none truncate"
              style={{
                fontSize: 12,
                maxWidth: 80,
              }}
              title={marker.name}
            >
              {marker.name}
            </div>
            {/* Number badge */}
            {badgeNumber !== null && (
              <div
                className={`flex items-center justify-center h-4 px-1 rounded text-xs select-none ${
                  isMarkerActive(index)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-neutral-800 text-neutral-300'
                }`}
                style={{
                  fontFamily: 'monospace',
                  minWidth: 16,
                }}
              >
                {badgeNumber}
              </div>
            )}
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
