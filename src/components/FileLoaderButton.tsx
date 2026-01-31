import { useRef, useCallback, type ChangeEvent } from 'react';
import { SUPPORTED_AUDIO_FORMATS, SUPPORTED_EXTENSIONS } from '../types/audio';

/**
 * Build the accept attribute for file input from supported formats
 * Includes both MIME types and extensions for better browser compatibility
 */
const FILE_INPUT_ACCEPT = [
  ...SUPPORTED_AUDIO_FORMATS,
  ...SUPPORTED_EXTENSIONS,
].join(',');

export interface FileLoaderButtonProps {
  /** Callback when a valid audio file is selected */
  onFileSelected: (file: File) => void;
}

/**
 * Check if a file has a supported audio format
 */
function isFileSupported(file: File): boolean {
  // Check MIME type
  if (SUPPORTED_AUDIO_FORMATS.includes(file.type as typeof SUPPORTED_AUDIO_FORMATS[number])) {
    return true;
  }

  // Fallback to extension check for files with missing/generic MIME types
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(extension as typeof SUPPORTED_EXTENSIONS[number]);
}

/**
 * Subtle button to load a new audio file, used when waveform is displayed
 */
export function FileLoaderButton({ onFileSelected }: FileLoaderButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (!isFileSupported(file)) {
      // Silently ignore unsupported files - error handling is done in parent
      return;
    }

    onFileSelected(file);

    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelected]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Load new audio file"
      />
      <button
        type="button"
        onClick={handleClick}
        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors tracking-wide"
        title="Load new file"
      >
        Load file
      </button>
    </>
  );
}
