import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DropZone } from './components/DropZone';
import { WaveformCanvas } from './components/WaveformCanvas';
import { MarkerControlStrip, type ExportFormat } from './components/MarkerControlStrip';
import { FileLoaderButton } from './components/FileLoaderButton';
import { EditorToolbar } from './components/EditorToolbar';
import type { ExportAllFormat } from './components/ExportAllButton';
import { ExportProgressOverlay } from './components/ExportProgressOverlay';
import { ConfirmResetDialog } from './components/ConfirmResetDialog';
import { audioService } from './services/AudioService';
import { waveformService } from './services/WaveformService';
import { encodeWav, encodeMp3, sanitizeFilename, createZipArchive } from './services/audioExport';
import { saveAs } from 'file-saver';
import { useZoom } from './hooks/useZoom';
import { useMarkers } from './hooks/useMarkers';
import { usePlayback } from './hooks/usePlayback';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useExportProgress } from './hooks/useExportProgress';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { getSections } from './utils/sections';
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
  const { markers, selectedMarkerId, addMarker, updateMarker, updateMarkerSilent, updateMarkerAtomic, updateMarkerName, updateMarkerEnabled, deleteMarker, setSelectedMarkerId, clearMarkers, canUndo, canRedo, undo, redo, reset } = useMarkers();

  // Calculate sections from markers
  const sections = useMemo(() => getSections(markers, audioDuration), [markers, audioDuration]);

  // Audio playback
  const { playSegment, stop, pause, resume, state: playbackState, currentTime: playbackCurrentTime, segmentStart, segmentEnd } = usePlayback({ audioBuffer });

  // Handle keyboard shortcut press for visual feedback (blink animation)
  const handleSectionKeyPressed = useCallback((keyboardIndex: number) => {
    setPressedKeyboardIndex(keyboardIndex);
    // Clear after animation duration (~250ms)
    setTimeout(() => {
      setPressedKeyboardIndex(null);
    }, 250);
  }, []);

  // Keyboard controls for playback (1-9 keys, spacebar pause/resume, Escape stop, Cmd/Ctrl+Z undo/redo)
  useKeyboardControls({
    sections,
    playbackState,
    onPlaySegment: playSegment,
    onPause: pause,
    onResume: resume,
    onStop: stop,
    onSectionKeyPressed: handleSectionKeyPressed,
    canUndo,
    canRedo,
    onUndo: undo,
    onRedo: redo,
  });

  // Export progress state
  const { isExporting, currentItem, totalItems, startExport, updateProgress, completeExport } = useExportProgress();

  // Toast notifications
  const { message: toastMessage, type: toastType, visible: toastVisible, showToast, hideToast } = useToast();

  // Track which section is currently being exported (for individual export spinner)
  const [exportingSectionId, setExportingSectionId] = useState<string | null>(null);

  // Track which keyboard index was pressed (for blink animation)
  const [pressedKeyboardIndex, setPressedKeyboardIndex] = useState<number | null>(null);

  // Reset confirmation dialog state
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Handler to show reset confirmation dialog
  const handleResetClick = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  // Handler to confirm reset (clears markers and closes dialog)
  const handleConfirmReset = useCallback(() => {
    reset();
    setShowResetDialog(false);
  }, [reset]);

  // Handler to cancel reset (just closes dialog)
  const handleCancelReset = useCallback(() => {
    setShowResetDialog(false);
  }, []);

  // Handle export of individual sections
  const handleExportSection = useCallback(async (sectionId: string, format: ExportFormat) => {
    if (!audioBuffer) return;

    // Find the section
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    // Show spinner on export button
    setExportingSectionId(sectionId);

    // Use setTimeout to allow UI to update before encoding (which can be synchronous and blocking)
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      // Export based on selected format
      let filename: string;
      if (format === 'wav') {
        const blob = encodeWav(audioBuffer, section.startTime, section.endTime);
        filename = `${sanitizeFilename(section.name)}.wav`;
        saveAs(blob, filename);
      } else {
        const blob = encodeMp3(audioBuffer, section.startTime, section.endTime);
        filename = `${sanitizeFilename(section.name)}.mp3`;
        saveAs(blob, filename);
      }
      showToast(`Exported ${filename}`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      showToast(errorMessage, 'error');
    } finally {
      // Clear spinner
      setExportingSectionId(null);
    }
  }, [audioBuffer, sections, showToast]);

  // Handle section name update (updates the start marker's name)
  const handleUpdateSectionName = useCallback((sectionId: string, name: string) => {
    // Find the section and update its start marker's name
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    updateMarkerName(section.startMarker.id, name);
  }, [sections, updateMarkerName]);

  // Handle section enabled toggle (updates the start marker's enabled state)
  const handleToggleSectionEnabled = useCallback((sectionId: string) => {
    // Find the section and toggle its start marker's enabled state
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    updateMarkerEnabled(section.startMarker.id, !section.enabled);
  }, [sections, updateMarkerEnabled]);

  // Handle export all sections as ZIP
  const handleExportAll = useCallback(async (format: ExportAllFormat) => {
    if (!audioBuffer || sections.length === 0) return;

    // Start progress tracking
    startExport(sections.length);

    // Allow UI to update before starting encoding
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      // Encode each section (sections are derived from sorted markers)
      const files: Array<{ name: string; blob: Blob }> = [];

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        // Update progress before encoding each item
        updateProgress(i + 1, Math.round(((i + 1) / sections.length) * 100));

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));

        // Encode based on selected format using section boundaries
        const blob = format === 'wav'
          ? encodeWav(audioBuffer, section.startTime, section.endTime)
          : encodeMp3(audioBuffer, section.startTime, section.endTime);

        const extension = format === 'wav' ? '.wav' : '.mp3';
        const filename = `${sanitizeFilename(section.name)}${extension}`;

        files.push({ name: filename, blob });
      }

      // Create ZIP archive and download
      const zipBlob = await createZipArchive(files);
      saveAs(zipBlob, 'sections-export.zip');
      showToast(`Exported ${sections.length} sections to ZIP`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      showToast(errorMessage, 'error');
    } finally {
      // Complete progress tracking
      completeExport();
    }
  }, [audioBuffer, sections, startExport, updateProgress, completeExport, showToast]);

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
      <div className="flex-1 flex items-center justify-center px-3">
        <div ref={waveformContainerRef} className="w-full flex flex-col">
          {/* Editor toolbar (context-aware - appears when markers exist) */}
          <EditorToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onReset={handleResetClick}
            onExportAll={handleExportAll}
            hasMarkers={markers.length > 0}
            hasSections={sections.length > 0}
            disabled={playbackState === 'playing'}
          />
          {/* Marker control strip */}
          <MarkerControlStrip
            markers={markers}
            sections={sections}
            containerWidth={containerWidth}
            visibleRange={visibleRange}
            duration={audioDuration}
            onDeleteMarker={deleteMarker}
            onUpdateSectionName={handleUpdateSectionName}
            onExportSection={handleExportSection}
            exportingSectionId={exportingSectionId}
            onToggleSectionEnabled={handleToggleSectionEnabled}
            pressedKeyboardIndex={pressedKeyboardIndex}
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
            onUpdateMarkerSilent={updateMarkerSilent}
            onUpdateMarkerAtomic={updateMarkerAtomic}
            onDeleteMarker={deleteMarker}
            playbackState={playbackState}
            playbackCurrentTime={playbackCurrentTime}
            playbackSegmentStart={segmentStart}
            playbackSegmentEnd={segmentEnd}
            sections={sections}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-3 bg-red-900 border border-red-700 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Export progress overlay */}
      <ExportProgressOverlay
        isVisible={isExporting}
        currentItem={currentItem}
        totalItems={totalItems}
      />

      {/* Toast notification */}
      {toastVisible && (
        <Toast
          message={toastMessage}
          type={toastType}
          onDismiss={hideToast}
        />
      )}

      {/* Reset confirmation dialog */}
      <ConfirmResetDialog
        isVisible={showResetDialog}
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </div>
  );
}

export default App;
