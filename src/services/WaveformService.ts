import type { WaveformPeaks, WaveformExtractionOptions } from '../types/waveform';

/**
 * Service for extracting waveform peak data from AudioBuffer
 */
export class WaveformService {
  /**
   * Extract waveform peak data from an AudioBuffer
   * Downsamples the audio data to a specified number of peaks for efficient rendering
   *
   * @param audioBuffer - The decoded AudioBuffer to extract peaks from
   * @param options - Extraction options including target resolution
   * @returns WaveformPeaks containing normalized peak values
   */
  public extractPeaks(
    audioBuffer: AudioBuffer,
    options: WaveformExtractionOptions
  ): WaveformPeaks {
    const { targetPeaks, channelStrategy = 'combine' } = options;
    const { length, numberOfChannels, sampleRate, duration } = audioBuffer;

    // Calculate samples per peak for the target resolution
    const samplesPerPeak = Math.ceil(length / targetPeaks);
    const actualPeakCount = Math.ceil(length / samplesPerPeak);

    // Create output array
    const peaks = new Float32Array(actualPeakCount);

    // Get channel data based on strategy
    const channelData = this.getChannelData(audioBuffer, channelStrategy, numberOfChannels);

    // Extract peaks by finding max absolute value in each segment
    for (let peakIndex = 0; peakIndex < actualPeakCount; peakIndex++) {
      const startSample = peakIndex * samplesPerPeak;
      const endSample = Math.min(startSample + samplesPerPeak, length);

      let maxPeak = 0;
      let maxPeakSigned = 0;

      for (let sampleIndex = startSample; sampleIndex < endSample; sampleIndex++) {
        const value = channelData[sampleIndex];
        const absValue = Math.abs(value);
        if (absValue > maxPeak) {
          maxPeak = absValue;
          maxPeakSigned = value;
        }
      }

      // Store the signed peak value to preserve waveform shape
      peaks[peakIndex] = maxPeakSigned;
    }

    return {
      peaks,
      samplesPerPeak,
      sampleRate,
      duration,
    };
  }

  /**
   * Get combined or single channel data from AudioBuffer
   */
  private getChannelData(
    audioBuffer: AudioBuffer,
    strategy: 'combine' | 'first',
    numberOfChannels: number
  ): Float32Array {
    // For single channel or 'first' strategy, just return first channel
    if (numberOfChannels === 1 || strategy === 'first') {
      return audioBuffer.getChannelData(0);
    }

    // Combine all channels by averaging
    const length = audioBuffer.length;
    const combined = new Float32Array(length);

    // Get all channel data
    const channels: Float32Array[] = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    // Average all channels
    for (let sampleIndex = 0; sampleIndex < length; sampleIndex++) {
      let sum = 0;
      for (let channelIndex = 0; channelIndex < numberOfChannels; channelIndex++) {
        sum += channels[channelIndex][sampleIndex];
      }
      combined[sampleIndex] = sum / numberOfChannels;
    }

    return combined;
  }

  /**
   * Calculate optimal peak count based on container width and desired detail level
   * Useful for responsive waveform rendering
   *
   * @param containerWidth - Width of the container in pixels
   * @param peaksPerPixel - Number of peaks per pixel (1-4 recommended)
   * @returns Optimal number of peaks
   */
  public calculateOptimalPeakCount(containerWidth: number, peaksPerPixel: number = 2): number {
    return Math.ceil(containerWidth * peaksPerPixel);
  }

  /**
   * Re-extract peaks for a new resolution
   * Useful when the display size changes
   */
  public resample(
    audioBuffer: AudioBuffer,
    newTargetPeaks: number,
    channelStrategy: 'combine' | 'first' = 'combine'
  ): WaveformPeaks {
    return this.extractPeaks(audioBuffer, {
      targetPeaks: newTargetPeaks,
      channelStrategy,
    });
  }
}

// Export singleton instance for convenience
export const waveformService = new WaveformService();
