import { useState, useRef, useEffect, useCallback } from 'react';
import type { Section } from '../types/section';
import type { VisibleRange } from '../types/zoom';

export type ExportFormat = 'wav' | 'mp3';

export interface SectionHeaderProps {
  /** The section to display */
  section: Section;
  /** Index of the section (0-based) for default naming */
  sectionIndex: number;
  /** Width of the container in pixels */
  containerWidth: number;
  /** Visible time range for positioning */
  visibleRange?: VisibleRange;
  /** Total audio duration in seconds */
  duration: number;
  /** Callback when user updates the section name */
  onUpdateName?: (sectionId: string, name: string) => void;
  /** Callback when user clicks to export the section */
  onExport?: (sectionId: string, format: ExportFormat) => void;
  /** Whether this section is currently being exported */
  isExporting?: boolean;
}

interface EditableNameProps {
  name: string;
  sectionId: string;
  sectionIndex: number;
  onUpdateName: (sectionId: string, name: string) => void;
  /** Maximum width available for the name in pixels */
  maxWidth: number;
  /** Callback to report whether the name is truncated */
  onTruncatedChange?: (isTruncated: boolean) => void;
}

/**
 * Inline editable section name component
 */
function EditableName({ name, sectionId, sectionIndex, onUpdateName, maxWidth, onTruncatedChange }: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Detect truncation by comparing scrollWidth with clientWidth
  useEffect(() => {
    if (!isEditing && textRef.current && onTruncatedChange) {
      const isTruncated = textRef.current.scrollWidth > textRef.current.clientWidth;
      onTruncatedChange(isTruncated);
    }
  }, [name, maxWidth, isEditing, onTruncatedChange]);

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();
    const finalName = trimmedValue || `Section ${sectionIndex + 1}`;
    onUpdateName(sectionId, finalName);
    setIsEditing(false);
  }, [editValue, sectionId, sectionIndex, onUpdateName]);

  const handleCancel = useCallback(() => {
    setEditValue(name);
    setIsEditing(false);
  }, [name]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(name);
    setIsEditing(true);
  }, [name]);

  // Constrain maxWidth to a reasonable input width
  const inputWidth = Math.min(Math.max(maxWidth, 60), 150);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-neutral-700 text-neutral-100 rounded px-1 outline-none focus:ring-1 focus:ring-cyan-500"
        style={{
          fontSize: 12,
          width: inputWidth,
          height: 18,
        }}
      />
    );
  }

  return (
    <div
      ref={textRef}
      className="text-neutral-300 select-none truncate cursor-pointer hover:text-neutral-100"
      style={{
        fontSize: 12,
        maxWidth: maxWidth,
      }}
      title={name}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {name}
    </div>
  );
}

interface ExportDropdownProps {
  sectionId: string;
  onExport: (sectionId: string, format: ExportFormat) => void;
  isExporting?: boolean;
}

/**
 * Export dropdown component with WAV and MP3 options
 */
function ExportDropdown({ sectionId, onExport, isExporting }: ExportDropdownProps) {
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

  const handleExport = useCallback((format: ExportFormat) => {
    onExport(sectionId, format);
    setIsOpen(false);
  }, [sectionId, onExport]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Export button (download icon or spinner) */}
      <div
        className={`flex items-center justify-center w-4 h-4 rounded bg-neutral-700 text-neutral-300 text-xs select-none transition-opacity ${
          isExporting ? 'cursor-wait' : 'cursor-pointer hover:opacity-80'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isExporting) {
            setIsOpen(!isOpen);
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title={isExporting ? 'Exporting...' : 'Export section'}
      >
        {isExporting ? (
          <div className="w-3 h-3 border border-neutral-500 border-t-cyan-400 rounded-full animate-spin" />
        ) : (
          '↓'
        )}
      </div>
      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full left-1/2 mt-1 py-1 rounded shadow-lg z-50"
          style={{
            transform: 'translateX(-50%)',
            backgroundColor: '#1f1f1f',
            minWidth: 60,
          }}
        >
          <div
            className="px-3 py-1 text-neutral-200 text-xs cursor-pointer hover:bg-neutral-700"
            onClick={(e) => {
              e.stopPropagation();
              handleExport('wav');
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            WAV
          </div>
          <div
            className="px-3 py-1 text-neutral-200 text-xs cursor-pointer hover:bg-neutral-700"
            onClick={(e) => {
              e.stopPropagation();
              handleExport('mp3');
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            MP3
          </div>
        </div>
      )}
    </div>
  );
}

// Constants for layout calculations
const EXPORT_BUTTON_WIDTH = 16; // w-4 = 16px
const GAP_WIDTH = 4; // gap-1 = 4px
const PADDING = 8; // safety margin on each side
const MIN_NAME_WIDTH = 40; // minimum width to show name

/**
 * Section header component that displays section name and export button
 * Positioned horizontally centered between section start and end markers
 */
export function SectionHeader({
  section,
  sectionIndex,
  containerWidth,
  visibleRange,
  duration,
  onUpdateName,
  onExport,
  isExporting,
}: SectionHeaderProps) {
  // Track whether the name is truncated (for future popover feature)
  const [isTruncated, setIsTruncated] = useState(false);

  /**
   * Calculate the pixel X position for a time value
   */
  const getPixelX = (time: number): number => {
    if (containerWidth === 0) return 0;

    const rangeStart = visibleRange?.start ?? 0;
    const rangeEnd = visibleRange?.end ?? duration;
    const rangeDuration = rangeEnd - rangeStart;

    const fraction = (time - rangeStart) / rangeDuration;
    return fraction * containerWidth;
  };

  // Calculate the center position between start and end markers
  const startX = getPixelX(section.startTime);
  const endX = getPixelX(section.endTime);
  const centerX = (startX + endX) / 2;

  // Calculate available width for the name
  // Available space = distance between markers - export button - gap - padding
  const sectionWidth = endX - startX;
  const exportButtonSpace = onExport ? EXPORT_BUTTON_WIDTH + GAP_WIDTH : 0;
  const availableNameWidth = sectionWidth - exportButtonSpace - PADDING * 2;

  // Determine if we should show the name based on available space
  const showName = availableNameWidth >= MIN_NAME_WIDTH;

  // Constrain name width to available space (with reasonable bounds)
  const nameMaxWidth = Math.max(MIN_NAME_WIDTH, Math.min(availableNameWidth, 200));

  // Callback to track truncation state
  const handleTruncatedChange = useCallback((truncated: boolean) => {
    setIsTruncated(truncated);
  }, []);

  // Log truncation state for debugging (will be used by US-009 for popover)
  void isTruncated;

  return (
    <div
      className="absolute flex items-center gap-1"
      style={{
        left: centerX,
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Section name - only show if enough space */}
      {showName && (
        onUpdateName ? (
          <EditableName
            name={section.name}
            sectionId={section.id}
            sectionIndex={sectionIndex}
            onUpdateName={onUpdateName}
            maxWidth={nameMaxWidth}
            onTruncatedChange={handleTruncatedChange}
          />
        ) : (
          <div
            className="text-neutral-300 select-none truncate"
            style={{
              fontSize: 12,
              maxWidth: nameMaxWidth,
            }}
            title={section.name}
          >
            {section.name}
          </div>
        )
      )}
      {/* Export button */}
      {onExport && (
        <ExportDropdown
          sectionId={section.id}
          onExport={onExport}
          isExporting={isExporting}
        />
      )}
    </div>
  );
}
