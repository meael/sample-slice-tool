/**
 * Supported audio file formats
 */
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
  'audio/x-flac',
] as const;

/**
 * Supported file extensions
 */
export const SUPPORTED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.aac', '.flac'] as const;

export type SupportedAudioFormat = (typeof SUPPORTED_AUDIO_FORMATS)[number];
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

/**
 * Audio metadata extracted from decoded audio
 */
export interface AudioMetadata {
  /** Duration in seconds */
  duration: number;
  /** Sample rate in Hz */
  sampleRate: number;
  /** Number of audio channels */
  numberOfChannels: number;
  /** Total number of samples per channel */
  length: number;
}

/**
 * Result of successful audio decoding
 */
export interface AudioDecodeResult {
  audioBuffer: AudioBuffer;
  metadata: AudioMetadata;
}

/**
 * Error types for audio decoding
 */
export type AudioDecodeErrorType =
  | 'UNSUPPORTED_FORMAT'
  | 'DECODE_ERROR'
  | 'FILE_READ_ERROR';

/**
 * Audio decode error with type information
 */
export class AudioDecodeError extends Error {
  readonly type: AudioDecodeErrorType;

  constructor(type: AudioDecodeErrorType, message: string) {
    super(message);
    this.name = 'AudioDecodeError';
    this.type = type;
  }
}
