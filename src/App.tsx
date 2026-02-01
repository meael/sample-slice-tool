import { useState, useCallback, useRef, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { WaveformCanvas } from './components/WaveformCanvas';
import { MarkerControlStrip, type ExportFormat } from './components/MarkerControlStrip';
import { FileLoaderButton } from './components/FileLoaderButton';
import { audioService } from './services/AudioService';
import { waveformService } from './services/WaveformService';
import { encodeWav, encodeMp3, sanitizeFilename } from './services/audioExport';
import { saveAs } from 'file-saver';
import { useZoom } from './hooks/useZoom';
import { useMarkers } from './hooks/useMarkers';
import { usePlayback } from './hooks/usePlayback';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import type { WaveformPeaks } from './types/waveform';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<WaveformPeaks | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Zoom and pan state management
  const { visibleRange, zoomAtPoint, setPan, panOffset, reset: resetZoom } = useZoom({
    duration: audioDuration,
    minZoom: 1,
    maxZoom: 100,
    zoomStep: 1.2, // Smoother zoom transitions
  });

  // Marker state management
  const { markers, selectedMarkerId, addMarker, updateMarker, updateMarkerName, deleteMarker, setSelectedMarkerId, clearMarkers } = useMarkers();

  // Audio playback
  const { playSegment, stop, pause, resume, state: playbackState, currentTime: playbackCurrentTime, segmentStart, segmentEnd } = usePlayback({ audioBuffer });

  // Keyboard controls for playback (1-9 keys, spacebar pause/resume, Escape stop)
  useKeyboardControls({
    markers,
    duration: audioDuration,
    playbackState,
    onPlaySegment: playSegment,
    onPause: pause,
    onResume: resume,
    onStop: stop,
  });

  // Handle export of individual marker sections
  const handleExportMarker = useCallback((markerId: string, format: ExportFormat) => {
    if (!audioBuffer) return;

    // Find the marker and its index
    const markerIndex = markers.findIndex(m => m.id === markerId);
    if (markerIndex === -1) return;

    const marker = markers[markerIndex];

    // Calculate section boundaries: this marker's time to next marker's time (or end)
    const startTime = marker.time;
    const endTime = markerIndex + 1 < markers.length
      ? markers[markerIndex + 1].time
      : audioDuration;

    // Export based on selected format
    if (format === 'wav') {
      const blob = encodeWav(audioBuffer, startTime, endTime);
      const filename = `${sanitizeFilename(marker.name)}.wav`;
      saveAs(blob, filename);
    } else if (format === 'mp3') {
      const blob = encodeMp3(audioBuffer, startTime, endTime);
      const filename = `${sanitizeFilename(marker.name)}.mp3`;
      saveAs(blob, filename);
    }
  }, [audioBuffer, markers, audioDuration]);

  // Waveform container ref and width for MarkerControlStrip
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (waveformContainerRef.current) {
        setContainerWidth(waveformContainerRef.current.getBoundingClientRect().width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [waveformData]);

  const handleFileLoaded = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Decode audio file
      const { audioBuffer: decodedBuffer, metadata } = await audioService.decodeFile(file);

      // Store audio buffer for playback
      setAudioBuffer(decodedBuffer);

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

      const peaks = waveformService.extractPeaks(decodedBuffer, {
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
          <div className="fixed bottom-4 left-4 right-4 p-3 bg-red-900 border border-red-700 text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Show waveform
  return (
    <div className="w-full h-full flex flex-col bg-neutral-900">
      {/* Header with load file button */}
      <div className="flex-shrink-0 p-3 flex items-center gap-3">
        <FileLoaderButton onFileSelected={handleFileLoaded} />
        {isLoading && (
          <span className="text-neutral-400 text-xs">Loading...</span>
        )}
      </div>

      {/* Waveform area */}
      <div className="flex-1 flex items-center justify-center">
        <div ref={waveformContainerRef} className="w-full flex flex-col">
          {/* Marker control strip */}
          <MarkerControlStrip
            markers={markers}
            containerWidth={containerWidth}
            visibleRange={visibleRange}
            duration={audioDuration}
            onDeleteMarker={deleteMarker}
            onUpdateMarkerName={updateMarkerName}
            onExportMarker={handleExportMarker}
            playbackState={playbackState}
            playbackSegmentStart={segmentStart}
            playbackSegmentEnd={segmentEnd}
          />
          {/* Waveform canvas */}
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
            playbackState={playbackState}
            playbackCurrentTime={playbackCurrentTime}
            playbackSegmentStart={segmentStart}
            playbackSegmentEnd={segmentEnd}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-3 bg-red-900 border border-red-700 text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
