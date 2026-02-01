/**
 * Represents a marker on the waveform timeline
 */
export interface Marker {
  /** Unique identifier for the marker */
  id: string;
  /** Time position in seconds */
  time: number;
  /** Display name for the section */
  name: string;
  /** Whether the section starting at this marker is enabled (default: true) */
  enabled?: boolean;
}

/**
 * State for marker management
 */
export interface MarkersState {
  /** All markers, sorted by time position */
  markers: Marker[];
  /** Currently selected marker ID, or null if none selected */
  selectedMarkerId: string | null;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
}

/**
 * Actions available for marker management
 */
export interface MarkersActions {
  /** Add a new marker at the specified time */
  addMarker: (time: number) => Marker;
  /** Update an existing marker's time */
  updateMarker: (id: string, time: number) => void;
  /** Update an existing marker's time without creating undo history (for intermediate drag updates) */
  updateMarkerSilent: (id: string, time: number) => void;
  /**
   * Update an existing marker's time with explicit from/to for atomic undo.
   * Records the change from fromTime to toTime as a single history entry.
   */
  updateMarkerAtomic: (id: string, fromTime: number, toTime: number) => void;
  /** Update an existing marker's name */
  updateMarkerName: (id: string, name: string) => void;
  /** Update an existing marker's enabled state */
  updateMarkerEnabled: (id: string, enabled: boolean) => void;
  /** Delete a marker by ID */
  deleteMarker: (id: string) => void;
  /** Get all markers */
  getMarkers: () => Marker[];
  /** Set the selected marker ID */
  setSelectedMarkerId: (id: string | null) => void;
  /** Clear all markers */
  clearMarkers: () => void;
  /** Undo the last marker operation */
  undo: () => void;
  /** Redo the last undone operation */
  redo: () => void;
  /** Reset all markers and clear undo/redo history */
  reset: () => void;
}
