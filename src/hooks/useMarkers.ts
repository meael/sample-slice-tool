import { useCallback, useState } from 'react';
import type { Marker, MarkersActions, MarkersState } from '../types/marker';
import { useUndoRedo } from './useUndoRedo';

/**
 * Generate a unique ID for a marker
 */
function generateMarkerId(): string {
  return `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sort markers by time position (ascending)
 */
function sortMarkersByTime(markers: Marker[]): Marker[] {
  return [...markers].sort((a, b) => a.time - b.time);
}

/**
 * Hook for managing marker positions on the waveform
 *
 * Provides CRUD operations for markers with automatic sorting by time
 * and support for a selected marker state.
 */
export function useMarkers(): MarkersState & MarkersActions {
  const {
    state: markers,
    setState: setMarkers,
    setStateWithoutHistory: setMarkersWithoutHistory,
    setStateWithExplicitHistory: setMarkersWithExplicitHistory,
    canUndo,
    canRedo,
    undo,
    redo,
    clearHistory,
  } = useUndoRedo<Marker[]>([]);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const addMarker = useCallback((time: number): Marker => {
    let newMarker: Marker;

    setMarkers((prev) => {
      const sectionNumber = prev.length + 1;
      newMarker = {
        id: generateMarkerId(),
        time,
        name: `Section ${sectionNumber}`,
        enabled: true,
      };
      return sortMarkersByTime([...prev, newMarker]);
    });

    // TypeScript needs this assertion since newMarker is set inside the callback
    setSelectedMarkerId(newMarker!.id);

    return newMarker!;
  }, [setMarkers]);

  const updateMarker = useCallback((id: string, time: number): void => {
    setMarkers((prev) => {
      const updated = prev.map((marker) =>
        marker.id === id ? { ...marker, time } : marker
      );
      return sortMarkersByTime(updated);
    });
  }, [setMarkers]);

  const updateMarkerSilent = useCallback((id: string, time: number): void => {
    setMarkersWithoutHistory((prev) => {
      const updated = prev.map((marker) =>
        marker.id === id ? { ...marker, time } : marker
      );
      return sortMarkersByTime(updated);
    });
  }, [setMarkersWithoutHistory]);

  const updateMarkerAtomic = useCallback((id: string, fromTime: number, toTime: number): void => {
    // Create explicit "from" and "to" states for atomic undo
    // This allows a drag operation to be undone in a single step
    const fromState = sortMarkersByTime(
      markers.map((marker) =>
        marker.id === id ? { ...marker, time: fromTime } : marker
      )
    );
    const toState = sortMarkersByTime(
      markers.map((marker) =>
        marker.id === id ? { ...marker, time: toTime } : marker
      )
    );
    setMarkersWithExplicitHistory(fromState, toState);
  }, [setMarkersWithExplicitHistory, markers]);

  const updateMarkerName = useCallback((id: string, name: string): void => {
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, name } : marker
      )
    );
  }, [setMarkers]);

  const updateMarkerEnabled = useCallback((id: string, enabled: boolean): void => {
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, enabled } : marker
      )
    );
  }, [setMarkers]);

  const deleteMarker = useCallback((id: string): void => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id));
    setSelectedMarkerId((prev) => (prev === id ? null : prev));
  }, [setMarkers]);

  const getMarkers = useCallback((): Marker[] => {
    return markers;
  }, [markers]);

  const clearMarkers = useCallback((): void => {
    setMarkers([]);
    setSelectedMarkerId(null);
  }, [setMarkers]);

  const reset = useCallback((): void => {
    setMarkers([]);
    setSelectedMarkerId(null);
    clearHistory();
  }, [setMarkers, clearHistory]);

  return {
    markers,
    selectedMarkerId,
    canUndo,
    canRedo,
    addMarker,
    updateMarker,
    updateMarkerSilent,
    updateMarkerAtomic,
    updateMarkerName,
    updateMarkerEnabled,
    deleteMarker,
    getMarkers,
    setSelectedMarkerId,
    clearMarkers,
    undo,
    redo,
    reset,
  };
}
