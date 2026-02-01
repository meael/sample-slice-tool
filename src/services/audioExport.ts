// Audio export utilities
// Dependencies: lamejs for MP3 encoding, jszip for ZIP archives, file-saver for downloads

import { Mp3Encoder } from 'lamejs';
import type { Mp3Encoder as Mp3EncoderType } from 'lamejs';
import type JSZipType from 'jszip';
import type { saveAs as saveAsType } from 'file-saver';

// Re-export types for use in other modules
export type { Mp3EncoderType, JSZipType, saveAsType };

/**
 * Encodes a segment of an AudioBuffer as a WAV file.
 * @param audioBuffer The source AudioBuffer
 * @param startTime Start time in seconds
 * @param endTime End time in seconds
 * @returns Blob containing WAV audio data
 */
export function encodeWav(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): Blob {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;

  // Calculate sample indices for the segment
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const numSamples = endSample - startSample;

  // Extract and interleave channel data
  const interleaved = new Float32Array(numSamples * numChannels);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < numSamples; i++) {
      const sampleIndex = startSample + i;
      // Clamp to valid range in case endTime exceeds buffer length
      const sample = sampleIndex < channelData.length ? channelData[sampleIndex] : 0;
      // Interleave: for stereo, samples go L0, R0, L1, R1, ...
      interleaved[i * numChannels + channel] = sample;
    }
  }

  // Convert float32 samples to 16-bit PCM
  const pcmData = new Int16Array(interleaved.length);
  for (let i = 0; i < interleaved.length; i++) {
    // Clamp to [-1, 1] then scale to 16-bit range
    const clamped = Math.max(-1, Math.min(1, interleaved[i]));
    pcmData[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  // Create WAV file
  const wavBuffer = createWavBuffer(pcmData, sampleRate, numChannels);

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Encodes a segment of an AudioBuffer as an MP3 file.
 * @param audioBuffer The source AudioBuffer
 * @param startTime Start time in seconds
 * @param endTime End time in seconds
 * @returns Blob containing MP3 audio data
 */
export function encodeMp3(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): Blob {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const kbps = 192; // MP3 bitrate

  // Calculate sample indices for the segment
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const numSamples = endSample - startSample;

  // Extract channel data and convert to 16-bit PCM
  const leftChannel = new Int16Array(numSamples);
  const rightChannel = numChannels > 1 ? new Int16Array(numSamples) : leftChannel;

  const leftData = audioBuffer.getChannelData(0);
  const rightData = numChannels > 1 ? audioBuffer.getChannelData(1) : leftData;

  for (let i = 0; i < numSamples; i++) {
    const sampleIndex = startSample + i;

    // Left channel
    const leftSample = sampleIndex < leftData.length ? leftData[sampleIndex] : 0;
    const leftClamped = Math.max(-1, Math.min(1, leftSample));
    leftChannel[i] = leftClamped < 0 ? leftClamped * 0x8000 : leftClamped * 0x7fff;

    // Right channel (same as left for mono)
    if (numChannels > 1) {
      const rightSample = sampleIndex < rightData.length ? rightData[sampleIndex] : 0;
      const rightClamped = Math.max(-1, Math.min(1, rightSample));
      rightChannel[i] = rightClamped < 0 ? rightClamped * 0x8000 : rightClamped * 0x7fff;
    }
  }

  // Create MP3 encoder
  const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);
  const mp3Chunks: BlobPart[] = [];

  // Encode in chunks for better performance
  const chunkSize = 1152; // MP3 frame size
  for (let i = 0; i < numSamples; i += chunkSize) {
    const leftChunk = leftChannel.subarray(i, i + chunkSize);
    const rightChunk = numChannels > 1 ? rightChannel.subarray(i, i + chunkSize) : undefined;

    const mp3Data = encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3Data.length > 0) {
      // Copy to new ArrayBuffer for Blob compatibility
      const buffer = new ArrayBuffer(mp3Data.length);
      const view = new Uint8Array(buffer);
      for (let j = 0; j < mp3Data.length; j++) {
        view[j] = mp3Data[j] & 0xff;
      }
      mp3Chunks.push(buffer);
    }
  }

  // Flush remaining data
  const flushData = encoder.flush();
  if (flushData.length > 0) {
    const buffer = new ArrayBuffer(flushData.length);
    const view = new Uint8Array(buffer);
    for (let j = 0; j < flushData.length; j++) {
      view[j] = flushData[j] & 0xff;
    }
    mp3Chunks.push(buffer);
  }

  // Combine all chunks into a single Blob
  return new Blob(mp3Chunks, { type: 'audio/mpeg' });
}

/**
 * Creates a WAV file buffer from PCM data.
 * @param pcmData 16-bit PCM samples (interleaved if stereo)
 * @param sampleRate Sample rate in Hz
 * @param numChannels Number of audio channels
 * @returns ArrayBuffer containing complete WAV file
 */
function createWavBuffer(
  pcmData: Int16Array,
  sampleRate: number,
  numChannels: number
): ArrayBuffer {
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true); // File size minus RIFF header
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const offset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(offset + i * 2, pcmData[i], true);
  }

  return buffer;
}

/**
 * Writes an ASCII string to a DataView at the specified offset.
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Sanitizes a string for use as a filename.
 * Removes invalid characters, replaces spaces with hyphens.
 * @param name The raw filename string
 * @returns A sanitized filename safe for use in file systems
 */
export function sanitizeFilename(name: string): string {
  // Trim whitespace first
  let sanitized = name.trim();

  // Remove invalid characters: / \ : * ? " < > |
  sanitized = sanitized.replace(/[/\\:*?"<>|]/g, '');

  // Replace spaces with hyphens
  sanitized = sanitized.replace(/\s+/g, '-');

  // Trim again in case removing characters left leading/trailing whitespace
  sanitized = sanitized.trim();

  // Return 'section' if result is empty
  return sanitized || 'section';
}
