import {
  AudioDecodeError,
  SUPPORTED_AUDIO_FORMATS,
  SUPPORTED_EXTENSIONS,
} from '../types/audio';
import type {
  AudioDecodeResult,
  AudioMetadata,
  SupportedAudioFormat,
} from '../types/audio';

/**
 * Service for decoding audio files using the Web Audio API
 */
export class AudioService {
  private audioContext: AudioContext | null = null;

  /**
   * Get or create the AudioContext instance
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Check if a file's MIME type is supported
   */
  private isSupportedMimeType(mimeType: string): mimeType is SupportedAudioFormat {
    return SUPPORTED_AUDIO_FORMATS.includes(mimeType as SupportedAudioFormat);
  }

  /**
   * Check if a file's extension is supported
   */
  private isSupportedExtension(fileName: string): boolean {
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    return SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number]);
  }

  /**
   * Validate that the file is a supported audio format
   */
  public isSupported(file: File): boolean {
    // Check MIME type first
    if (file.type && this.isSupportedMimeType(file.type)) {
      return true;
    }
    // Fall back to extension check (some files may not have correct MIME types)
    return this.isSupportedExtension(file.name);
  }

  /**
   * Extract metadata from an AudioBuffer
   */
  private extractMetadata(audioBuffer: AudioBuffer): AudioMetadata {
    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      length: audioBuffer.length,
    };
  }

  /**
   * Decode an audio file and return the AudioBuffer with metadata
   * @param file - The audio file to decode
   * @returns Promise resolving to AudioDecodeResult
   * @throws AudioDecodeError for unsupported formats or decode failures
   */
  public async decodeFile(file: File): Promise<AudioDecodeResult> {
    // Validate file format
    if (!this.isSupported(file)) {
      throw new AudioDecodeError(
        'UNSUPPORTED_FORMAT',
        `Unsupported audio format: ${file.type || 'unknown'}. Supported formats: WAV, MP3, M4A, AAC, FLAC`
      );
    }

    // Read file as ArrayBuffer
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (error) {
      throw new AudioDecodeError(
        'FILE_READ_ERROR',
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Decode audio data
    const audioContext = this.getAudioContext();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw new AudioDecodeError(
        'DECODE_ERROR',
        `Failed to decode audio: ${error instanceof Error ? error.message : 'File may be corrupted or in an unsupported format'}`
      );
    }

    return {
      audioBuffer,
      metadata: this.extractMetadata(audioBuffer),
    };
  }

  /**
   * Close the AudioContext and release resources
   */
  public async dispose(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance for convenience
export const audioService = new AudioService();
