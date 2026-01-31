import { useCallback, useState } from 'react';
import type { Marker, MarkersActions, MarkersState } from '../types/marker';

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
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const addMarker = useCallback((time: number): Marker => {
    const newMarker: Marker = {
      id: generateMarkerId(),
      time,
    };

    setMarkers((prev) => sortMarkersByTime([...prev, newMarker]));
    setSelectedMarkerId(newMarker.id);

    return newMarker;
  }, []);

  const updateMarker = useCallback((id: string, time: number): void => {
    setMarkers((prev) => {
      const updated = prev.map((marker) =>
        marker.id === id ? { ...marker, time } : marker
      );
      return sortMarkersByTime(updated);
    });
  }, []);

  const deleteMarker = useCallback((id: string): void => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id));
    setSelectedMarkerId((prev) => (prev === id ? null : prev));
  }, []);

  const getMarkers = useCallback((): Marker[] => {
    return markers;
  }, [markers]);

  const clearMarkers = useCallback((): void => {
    setMarkers([]);
    setSelectedMarkerId(null);
  }, []);

  return {
    markers,
    selectedMarkerId,
    addMarker,
    updateMarker,
    deleteMarker,
    getMarkers,
    setSelectedMarkerId,
    clearMarkers,
  };
}
