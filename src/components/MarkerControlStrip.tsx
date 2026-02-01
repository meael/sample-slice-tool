import { useState, useRef, useEffect, useCallback } from 'react';
import type { Marker } from '../types/marker';
import type { VisibleRange } from '../types/zoom';

export type ExportFormat = 'wav' | 'mp3';

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
  /** Callback when user clicks to export a marker section */
  onExportMarker?: (markerId: string, format: ExportFormat) => void;
  /** ID of marker currently being exported (for spinner) */
  exportingMarkerId?: string | null;
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

interface ExportDropdownProps {
  markerId: string;
  onExport: (markerId: string, format: ExportFormat) => void;
  /** Whether this marker is currently being exported */
  isExporting?: boolean;
}

/**
 * Export dropdown component with WAV and MP3 options
 */
function ExportDropdown({ markerId, onExport, isExporting }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = useCallback((format: ExportFormat) => {
    onExport(markerId, format);
    setIsOpen(false);
  }, [markerId, onExport]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Export button (download icon or spinner) */}
      <div
        className={`flex items-center justify-center w-4 h-4 rounded bg-neutral-700 text-neutral-300 text-xs select-none transition-opacity ${
          isExporting ? 'cursor-wait' : 'cursor-pointer hover:opacity-80'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isExporting) {
            setIsOpen(!isOpen);
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title={isExporting ? 'Exporting...' : 'Export section'}
      >
        {isExporting ? (
          <div className="w-3 h-3 border border-neutral-500 border-t-cyan-400 rounded-full animate-spin" />
        ) : (
          '↓'
        )}
      </div>
      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full left-1/2 mt-1 py-1 rounded shadow-lg z-50"
          style={{
            transform: 'translateX(-50%)',
            backgroundColor: '#1f1f1f',
            minWidth: 60,
          }}
        >
          <div
            className="px-3 py-1 text-neutral-200 text-xs cursor-pointer hover:bg-neutral-700"
            onClick={(e) => {
              e.stopPropagation();
              handleExport('wav');
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            WAV
          </div>
          <div
            className="px-3 py-1 text-neutral-200 text-xs cursor-pointer hover:bg-neutral-700"
            onClick={(e) => {
              e.stopPropagation();
              handleExport('mp3');
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            MP3
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Control strip component that renders above the waveform
 * Displays marker controls (name, export, delete) without obscuring the waveform
 */
export function MarkerControlStrip({
  markers,
  containerWidth,
  visibleRange,
  duration,
  onDeleteMarker,
  onUpdateMarkerName,
  onExportMarker,
  exportingMarkerId,
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
      {markers.map((marker, index) => {
        if (!isMarkerVisible(marker.time)) return null;
        const pixelX = getMarkerPixelX(marker.time);
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
            {/* Export button */}
            {onExportMarker && (
              <ExportDropdown
                markerId={marker.id}
                onExport={onExportMarker}
                isExporting={exportingMarkerId === marker.id}
              />
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
