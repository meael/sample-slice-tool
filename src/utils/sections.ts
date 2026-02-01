import type { Marker } from '../types/marker';
import type { Section } from '../types/section';

// Re-export Section type for convenience
export type { Section } from '../types/section';

/**
 * Calculate valid sections from markers.
 * A section exists only between consecutive markers (marker N to marker N+1).
 * Range before first marker is NOT a section.
 * Range after last marker is NOT a section.
 * Single marker alone returns empty array (no sections).
 *
 * @param markers - Array of markers (will be sorted by time internally)
 * @param duration - Total audio duration in seconds (available for future use)
 * @returns Array of Section objects
 */
export function getSections(markers: Marker[], duration?: number): Section[] {
  // Duration parameter available for future features (e.g., inactive region calculation)
  void duration;
  // Need at least 2 markers to form a section
  if (markers.length < 2) {
    return [];
  }

  // Sort markers by time position
  const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);

  const sections: Section[] = [];

  // Create sections between consecutive markers
  for (let i = 0; i < sortedMarkers.length - 1; i++) {
    const startMarker = sortedMarkers[i];
    const endMarker = sortedMarkers[i + 1];

    sections.push({
      id: `section-${startMarker.id}-${endMarker.id}`,
      startMarker,
      endMarker,
      startTime: startMarker.time,
      endTime: endMarker.time,
      name: startMarker.name,
    });
  }

  return sections;
}
