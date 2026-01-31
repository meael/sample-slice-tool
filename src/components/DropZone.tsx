import { useState, useCallback, useRef } from 'react';
import type { DragEvent } from 'react';
import { SUPPORTED_AUDIO_FORMATS, SUPPORTED_EXTENSIONS } from '../types/audio';

export interface DropZoneProps {
  /** Callback when a valid audio file is loaded */
  onFileLoaded: (file: File) => void;
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
 * Full-page drop zone for loading audio files via drag-and-drop
 */
export function DropZone({ onFileLoaded }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length === 0) {
      return;
    }

    const file = files[0];
    if (!isFileSupported(file)) {
      setError(`Unsupported file type. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return;
    }

    onFileLoaded(file);
  }, [onFileLoaded]);

  return (
    <div
      className={`
        w-full h-full flex flex-col items-center justify-center
        border-2 border-dashed transition-colors duration-150
        ${isDragging
          ? 'border-cyan-400 bg-cyan-400/10'
          : 'border-neutral-600 hover:border-neutral-500'
        }
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-neutral-400 text-sm">
          {isDragging ? 'Drop audio file here' : 'Drag and drop an audio file'}
        </p>

        <p className="text-neutral-500 text-xs">
          Supported: {SUPPORTED_EXTENSIONS.join(', ')}
        </p>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
