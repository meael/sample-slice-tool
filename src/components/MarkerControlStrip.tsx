import { useState, useRef, useEffect, useCallback } from 'react';
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
  /** Callback when user updates a marker's name */
  onUpdateMarkerName?: (markerId: string, name: string) => void;
  /** Current playback state */
  playbackState?: PlaybackState;
  /** Start time of the currently playing segment */
  playbackSegmentStart?: number;
  /** End time of the currently playing segment */
  playbackSegmentEnd?: number;
}

interface EditableNameProps {
  name: string;
  markerId: string;
  markerIndex: number;
  onUpdateName: (markerId: string, name: string) => void;
}

/**
 * Inline editable section name component
 */
function EditableName({ name, markerId, markerIndex, onUpdateName }: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();
    const finalName = trimmedValue || `Section ${markerIndex + 1}`;
    onUpdateName(markerId, finalName);
    setIsEditing(false);
  }, [editValue, markerId, markerIndex, onUpdateName]);

  const handleCancel = useCallback(() => {
    setEditValue(name);
    setIsEditing(false);
  }, [name]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(name);
    setIsEditing(true);
  }, [name]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-neutral-700 text-neutral-100 rounded px-1 outline-none focus:ring-1 focus:ring-cyan-500"
        style={{
          fontSize: 12,
          width: 80,
          height: 18,
        }}
      />
    );
  }

  return (
    <div
      className="text-neutral-300 select-none truncate cursor-pointer hover:text-neutral-100"
      style={{
        fontSize: 12,
        maxWidth: 80,
      }}
      title={name}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {name}
    </div>
  );
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
  onUpdateMarkerName,
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
            {onUpdateMarkerName ? (
              <EditableName
                name={marker.name}
                markerId={marker.id}
                markerIndex={index}
                onUpdateName={onUpdateMarkerName}
              />
            ) : (
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
            )}
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
