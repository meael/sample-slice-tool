/**
 * State for zoom and pan management
 */
export interface ZoomState {
  /** Zoom level (1 = full view, higher = zoomed in) */
  zoomLevel: number;
  /** Pan offset in seconds (horizontal scroll position) */
  panOffset: number;
}

/**
 * Options for configuring zoom behavior
 */
export interface ZoomOptions {
  /** Minimum zoom level (defaults to 1 = full view) */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Zoom multiplier per step (defaults to 1.5) */
  zoomStep?: number;
  /** Total audio duration in seconds (required for proper pan clamping) */
  duration: number;
}

/**
 * Actions available for zoom and pan management
 */
export interface ZoomActions {
  /** Zoom in by one step */
  zoomIn: () => void;
  /** Zoom out by one step */
  zoomOut: () => void;
  /** Zoom at a specific point (time in seconds) */
  zoomAtPoint: (time: number, direction: 'in' | 'out') => void;
  /** Set pan offset directly */
  setPan: (offset: number) => void;
  /** Reset zoom and pan to initial state */
  reset: () => void;
  /** Set zoom level directly */
  setZoomLevel: (level: number) => void;
}

/**
 * Calculate the visible time range based on zoom state
 */
export interface VisibleRange {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Duration of visible range in seconds */
  duration: number;
}
