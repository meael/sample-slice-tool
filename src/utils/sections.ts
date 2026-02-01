import type { Marker } from '../types/marker';

/**
 * Represents a valid section between two consecutive markers
 */
export interface Section {
  /** Unique identifier for the section */
  id: string;
  /** The starting marker of this section */
  startMarker: Marker;
  /** The ending marker of this section */
  endMarker: Marker;
  /** Start time in seconds (from startMarker) */
  startTime: number;
  /** End time in seconds (from endMarker) */
  endTime: number;
  /** Display name (inherited from startMarker) */
  name: string;
}

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
