import { useState, useCallback } from 'react';
import { DropZone } from './components/DropZone';
import { WaveformCanvas } from './components/WaveformCanvas';
import { audioService } from './services/AudioService';
import { waveformService } from './services/WaveformService';
import type { WaveformPeaks } from './types/waveform';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<WaveformPeaks | null>(null);

  const handleFileLoaded = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Decode audio file
      const { audioBuffer } = await audioService.decodeFile(file);

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
  }, []);

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
      />
    </div>
  );
}

export default App;
