import { useState } from 'react';
import { X } from 'lucide-react';
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

  /**
   * Build a map from marker ID to the section it starts (if any).
   * Used to determine if a marker starts an enabled or disabled section.
   */
  const getMarkerSectionMap = (): Map<string, Section> => {
    const map = new Map<string, Section>();
    sections.forEach(section => {
      map.set(section.startMarker.id, section);
    });
    return map;
  };

  const markerSectionMap = getMarkerSectionMap();

  // Track which marker is being hovered (for showing drag affordance)
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  // Track which marker control area is being hovered (for showing close icon on enabled sections)
  const [hoveredControlId, setHoveredControlId] = useState<string | null>(null);

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
        const section = markerSectionMap.get(marker.id);
        const isEnabledSection = section?.enabled ?? false;
        const isHovered = hoveredMarkerId === marker.id;
        const isControlHovered = hoveredControlId === marker.id;

        // For enabled sections: show keyboard label by default, close icon on hover
        // For disabled sections: always show close icon with not-allowed cursor
        const hasKeyboardLabel = isEnabledSection && keyboardIndex !== undefined;
        const isDisabledSection = section !== undefined && !section.enabled;

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
            {/* Top row: keyboard label OR close icon (centered above marker line) */}
            {/* Control container handles hover for swapping label/close */}
            {/* Uses min-w/min-h to create stable hover area that prevents flickering */}
            <div
              className="relative flex items-center justify-center mt-[3px] min-w-[20px] min-h-[18px]"
              style={{ cursor: isDisabledSection ? 'not-allowed' : 'default' }}
              onMouseEnter={() => setHoveredControlId(marker.id)}
              onMouseLeave={() => setHoveredControlId(null)}
            >
              {/* For enabled sections with keyboard labels: show both elements with opacity transitions */}
              {hasKeyboardLabel ? (
                <>
                  {/* Keyboard label - visible by default, hidden on hover */}
                  {/* pointer-events: none prevents this element from causing hover state changes */}
                  <div
                    className={`flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded text-[10px] font-medium leading-none select-none border shadow-sm transition-opacity duration-150 ${
                      pressedKeyboardIndex === keyboardIndex
                        ? 'bg-cyan-400 text-neutral-900 border-cyan-300 scale-110'
                        : 'bg-neutral-600 text-neutral-200 border-neutral-500'
                    }`}
                    style={{ opacity: isControlHovered ? 0 : 1, pointerEvents: 'none' }}
                    title={`Press ${keyboardIndex} to play`}
                  >
                    {keyboardIndex}
                  </div>
                  {/* Close icon - hidden by default, shown on hover */}
                  <div
                    className="absolute inset-0 m-auto flex items-center justify-center w-4 h-4 rounded-full bg-neutral-700 text-neutral-300 select-none cursor-pointer transition-all duration-150 hover:bg-red-600 hover:text-white"
                    style={{ opacity: isControlHovered ? 1 : 0, pointerEvents: isControlHovered ? 'auto' : 'none' }}
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
                    <X className="w-3 h-3" />
                  </div>
                </>
              ) : (
                /* For disabled sections or markers not starting a section: always show close icon */
                <div
                  className="flex items-center justify-center w-4 h-4 rounded-full bg-neutral-700 text-neutral-300 text-xs leading-none select-none cursor-pointer transition-colors hover:bg-red-600 hover:text-white"
                  style={{ cursor: 'pointer' }}
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
                  <X className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
