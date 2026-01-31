import { useState, useCallback } from 'react';
import { DropZone } from './components/DropZone';
import { WaveformCanvas } from './components/WaveformCanvas';
import { audioService } from './services/AudioService';
import { waveformService } from './services/WaveformService';
import { useZoom } from './hooks/useZoom';
import { useMarkers } from './hooks/useMarkers';
import type { WaveformPeaks } from './types/waveform';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<WaveformPeaks | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Zoom and pan state management
  const { visibleRange, zoomAtPoint, setPan, panOffset, reset: resetZoom } = useZoom({
    duration: audioDuration,
    minZoom: 1,
    maxZoom: 100,
    zoomStep: 1.2, // Smoother zoom transitions
  });

  // Marker state management
  const { markers, selectedMarkerId, addMarker, updateMarker, deleteMarker, setSelectedMarkerId, clearMarkers } = useMarkers();

  const handleFileLoaded = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Decode audio file
      const { audioBuffer, metadata } = await audioService.decodeFile(file);

      // Set audio duration for zoom calculations
      setAudioDuration(metadata.duration);

      // Reset zoom state and clear markers for new file
      resetZoom();
      clearMarkers();

      // Extract waveform peaks
      // Use a high resolution for detailed waveform rendering
      const targetPeaks = waveformService.calculateOptimalPeakCount(
        window.innerWidth,
        4 // 4 peaks per pixel for good detail
      );

      const peaks = waveformService.extractPeaks(audioBuffer, {
        targetPeaks,
        channelStrategy: 'combine',
      });

      setWaveformData(peaks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio file');
      setWaveformData(null);
    } finally {
      setIsLoading(false);
    }
  }, [resetZoom, clearMarkers]);

  // Show drop zone if no waveform loaded
  if (!waveformData) {
    return (
      <div className="w-full h-full">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-neutral-400 text-sm">Loading audio...</p>
          </div>
        ) : (
          <DropZone onFileLoaded={handleFileLoaded} />
        )}
        {error && (
          <div className="fixed bottom-4 left-4 right-4 p-3 bg-red-900/80 border border-red-700 text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Show waveform
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
      <WaveformCanvas
        peaks={waveformData}
        height={200}
        visibleRange={visibleRange}
        onZoomAtPoint={zoomAtPoint}
        onPan={setPan}
        panOffset={panOffset}
        onAddMarker={addMarker}
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        onSelectMarker={setSelectedMarkerId}
        onUpdateMarker={updateMarker}
        onDeleteMarker={deleteMarker}
      />
    </div>
  );
}

export default App;
