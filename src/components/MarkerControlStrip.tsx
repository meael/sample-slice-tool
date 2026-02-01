import { useState } from 'react';
import type { Marker } from '../types/marker';
import type { Section } from '../types/section';
import type { VisibleRange } from '../types/zoom';
import { SectionHeader, type ExportFormat } from './SectionHeader';

export type { ExportFormat };

export interface MarkerControlStripProps {
  /** Array of markers to display controls for */
  markers: Marker[];
  /** Array of sections (between consecutive markers) */
  sections: Section[];
  /** Width of the container in pixels */
  containerWidth: number;
  /** Visible time range for positioning markers */
  visibleRange?: VisibleRange;
  /** Total audio duration in seconds */
  duration: number;
  /** Callback when user clicks to delete a marker */
  onDeleteMarker?: (markerId: string) => void;
  /** Callback when user updates a section's name */
  onUpdateSectionName?: (sectionId: string, name: string) => void;
  /** Callback when user clicks to export a section */
  onExportSection?: (sectionId: string, format: ExportFormat) => void;
  /** ID of section currently being exported (for spinner) */
  exportingSectionId?: string | null;
  /** Callback when user toggles a section's enabled state */
  onToggleSectionEnabled?: (sectionId: string) => void;
  /** Keyboard index that was just pressed (for blink animation) */
  pressedKeyboardIndex?: number | null;
}

/**
 * Control strip component that renders above the waveform
 * Displays marker delete icons and section headers (name + export) between markers
 */
export function MarkerControlStrip({
  markers,
  sections,
  containerWidth,
  visibleRange,
  duration,
  onDeleteMarker,
  onUpdateSectionName,
  onExportSection,
  exportingSectionId,
  onToggleSectionEnabled,
  pressedKeyboardIndex,
}: MarkerControlStripProps) {
  /**
   * Calculate the pixel X position for a time value
   */
  const getPixelX = (time: number): number => {
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
   * Check if a section is at least partially within the visible range
   */
  const isSectionVisible = (startTime: number, endTime: number): boolean => {
    const rangeStart = visibleRange?.start ?? 0;
    const rangeEnd = visibleRange?.end ?? duration;
    // Section is visible if it overlaps with visible range
    return endTime > rangeStart && startTime < rangeEnd;
  };

  /**
   * Build a map from section ID to keyboard index (1-9) for enabled sections only.
   * Enabled sections get keyboard numbers 1-9 based on their position order.
   * Returns undefined for disabled sections or if index > 9.
   */
  const getKeyboardIndexMap = (): Map<string, number> => {
    const map = new Map<string, number>();
    const enabledSections = sections.filter(s => s.enabled);
    enabledSections.forEach((section, index) => {
      if (index < 9) {
        map.set(section.id, index + 1); // 1-indexed for keyboard display
      }
    });
    return map;
  };

  const keyboardIndexMap = getKeyboardIndexMap();

  /**
   * Build a map from marker ID to keyboard index.
   * A marker gets a keyboard index if it's the start marker of an enabled section.
   */
  const getMarkerKeyboardIndexMap = (): Map<string, number> => {
    const map = new Map<string, number>();
    sections.forEach(section => {
      const keyboardIndex = keyboardIndexMap.get(section.id);
      if (keyboardIndex !== undefined) {
        map.set(section.startMarker.id, keyboardIndex);
      }
    });
    return map;
  };

  const markerKeyboardIndexMap = getMarkerKeyboardIndexMap();

  // Track which marker is being hovered (for showing drag affordance)
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  return (
    <div
      className="relative w-full z-20"
      style={{
        height: 28,
        backgroundColor: '#111',
        borderBottom: '1px solid #333',
      }}
    >
      {/* Render section headers between markers */}
      {sections.map((section, index) => {
        if (!isSectionVisible(section.startTime, section.endTime)) return null;
        return (
          <SectionHeader
            key={`section-header-${section.id}`}
            section={section}
            sectionIndex={index}
            containerWidth={containerWidth}
            visibleRange={visibleRange}
            duration={duration}
            onUpdateName={onUpdateSectionName}
            onExport={onExportSection}
            isExporting={exportingSectionId === section.id}
            onToggleEnabled={onToggleSectionEnabled}
          />
        );
      })}

      {/* Render delete icons, keyboard badges, and drag affordances above each marker */}
      {markers.map((marker) => {
        if (!isMarkerVisible(marker.time)) return null;
        const pixelX = getPixelX(marker.time);
        const keyboardIndex = markerKeyboardIndexMap.get(marker.id);
        const isHovered = hoveredMarkerId === marker.id;
        return (
          <div
            key={`marker-delete-${marker.id}`}
            className="absolute flex flex-col items-center"
            style={{
              left: pixelX,
              top: 0,
              bottom: 0,
              transform: 'translateX(-50%)',
              cursor: isHovered ? 'ew-resize' : 'default',
            }}
            onMouseEnter={() => setHoveredMarkerId(marker.id)}
            onMouseLeave={() => setHoveredMarkerId(null)}
          >
            {/* Top row: keyboard badge (positioned left) and delete icon (centered) */}
            <div className="relative flex items-center justify-center mt-[5px]">
              {/* Keyboard badge - positioned to the left of center */}
              {keyboardIndex !== undefined && (
                <div
                  className={`absolute flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded text-[10px] font-medium leading-none select-none border shadow-sm transition-all duration-200 ${
                    pressedKeyboardIndex === keyboardIndex
                      ? 'bg-cyan-400 text-neutral-900 border-cyan-300 scale-110'
                      : 'bg-neutral-600 text-neutral-200 border-neutral-500'
                  }`}
                  style={{ right: '100%', marginRight: '4px' }}
                  title={`Press ${keyboardIndex} to play`}
                >
                  {keyboardIndex}
                </div>
              )}
              {/* Delete icon - centered above marker line */}
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
                title="Delete marker"
              >
                ×
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
