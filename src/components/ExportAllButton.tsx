import { useState, useRef, useEffect, useCallback } from 'react';

export type ExportAllFormat = 'wav' | 'mp3';

export interface ExportAllButtonProps {
  /** Callback when user selects an export format */
  onExportAll: (format: ExportAllFormat) => void;
}

/**
 * Button to export all sections as a ZIP archive
 * Opens a dropdown with WAV and MP3 format options
 */
export function ExportAllButton({ onExportAll }: ExportAllButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = useCallback((format: ExportAllFormat) => {
    onExportAll(format);
    setIsOpen(false);
  }, [onExportAll]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors tracking-wide flex items-center gap-1.5"
        title="Export all sections as ZIP"
      >
        <span>↓</span>
        <span>Export All</span>
      </button>
      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 py-1 rounded shadow-lg z-50"
          style={{
            backgroundColor: '#1f1f1f',
            minWidth: 80,
          }}
        >
          <div
            className="px-3 py-1.5 text-neutral-200 text-xs cursor-pointer hover:bg-neutral-700"
            onClick={() => handleExport('wav')}
          >
            WAV
          </div>
          <div
            className="px-3 py-1.5 text-neutral-200 text-xs cursor-pointer hover:bg-neutral-700"
            onClick={() => handleExport('mp3')}
          >
            MP3
          </div>
        </div>
      )}
    </div>
  );
}
