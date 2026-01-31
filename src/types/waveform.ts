/**
 * Waveform peak data for rendering
 */
export interface WaveformPeaks {
  /** Array of peak values normalized between -1 and 1 */
  peaks: Float32Array;
  /** Number of samples represented by each peak */
  samplesPerPeak: number;
  /** Sample rate of the source audio */
  sampleRate: number;
  /** Duration of the source audio in seconds */
  duration: number;
}

/**
 * Options for waveform extraction
 */
export interface WaveformExtractionOptions {
  /** Target number of peaks to extract (resolution) */
  targetPeaks: number;
  /**
   * Channel handling strategy:
   * - 'combine': Average all channels (default)
   * - 'first': Use only the first channel
   */
  channelStrategy?: 'combine' | 'first';
}
