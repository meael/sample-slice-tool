import type { Marker } from './marker';

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
