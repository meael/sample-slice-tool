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
          />
        );
      })}

      {/* Render delete icons above each marker */}
      {markers.map((marker) => {
        if (!isMarkerVisible(marker.time)) return null;
        const pixelX = getPixelX(marker.time);
        return (
          <div
            key={`marker-delete-${marker.id}`}
            className="absolute"
            style={{
              left: pixelX,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Delete icon */}
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
        );
      })}
    </div>
  );
}
