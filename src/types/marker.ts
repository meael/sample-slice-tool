/**
 * Represents a marker on the waveform timeline
 */
export interface Marker {
  /** Unique identifier for the marker */
  id: string;
  /** Time position in seconds */
  time: number;
}

/**
 * State for marker management
 */
export interface MarkersState {
  /** All markers, sorted by time position */
  markers: Marker[];
  /** Currently selected marker ID, or null if none selected */
  selectedMarkerId: string | null;
}

/**
 * Actions available for marker management
 */
export interface MarkersActions {
  /** Add a new marker at the specified time */
  addMarker: (time: number) => Marker;
  /** Update an existing marker's time */
  updateMarker: (id: string, time: number) => void;
  /** Delete a marker by ID */
  deleteMarker: (id: string) => void;
  /** Get all markers */
  getMarkers: () => Marker[];
  /** Set the selected marker ID */
  setSelectedMarkerId: (id: string | null) => void;
  /** Clear all markers */
  clearMarkers: () => void;
}
