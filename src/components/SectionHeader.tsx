import { useState, useRef, useEffect, useCallback } from 'react';
import type { Section } from '../types/section';
import type { VisibleRange } from '../types/zoom';
import { SectionDropdown } from './SectionDropdown';

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
  /** Callback when user toggles section enabled state */
  onToggleEnabled?: (sectionId: string) => void;
  /** Keyboard index (1-9) for this section, undefined if no keyboard shortcut */
  keyboardIndex?: number;
}

interface EditableNameProps {
  name: string;
  sectionId: string;
  sectionIndex: number;
  onUpdateName: (sectionId: string, name: string) => void;
  /** Maximum width available for the name in pixels */
  maxWidth: number;
  /** Whether the name is currently truncated (for popover vs inline editing) */
  isTruncated: boolean;
  /** Callback to report whether the name is truncated */
  onTruncatedChange?: (isTruncated: boolean) => void;
}

/**
 * Inline editable section name component
 * When truncated, opens a popover for editing instead of inline input
 */
function EditableName({ name, sectionId, sectionIndex, onUpdateName, maxWidth, isTruncated, onTruncatedChange }: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
      const truncated = textRef.current.scrollWidth > textRef.current.clientWidth;
      onTruncatedChange(truncated);
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

  // Constrain maxWidth to a reasonable input width for inline editing
  const inputWidth = Math.min(Math.max(maxWidth, 60), 150);

  // For truncated names, show a popover instead of inline editing
  if (isEditing && isTruncated) {
    return (
      <div className="relative">
        {/* The truncated text (still visible behind popover) */}
        <div
          ref={textRef}
          className="text-neutral-300 select-none truncate"
          style={{
            fontSize: 12,
            maxWidth: maxWidth,
          }}
        >
          {name}
        </div>
        {/* Floating popover positioned below the name */}
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1 p-2 rounded shadow-lg z-50"
          style={{
            backgroundColor: '#1f1f1f',
            minWidth: 150,
            maxWidth: 250,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full bg-neutral-700 text-neutral-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-cyan-500"
            style={{
              fontSize: 12,
            }}
          />
        </div>
      </div>
    );
  }

  // Non-truncated inline editing
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

// Constants for layout calculations
const GAP_WIDTH = 4; // gap-1 = 4px
const PADDING = 8; // safety margin on each side
const MIN_NAME_WIDTH = 40; // minimum width to show name
const DROPDOWN_ARROW_WIDTH = 12; // approximate width for the dropdown arrow

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
  // These props will be used in US-003 when implementing dropdown menu content
  onExport: _onExport,
  isExporting: _isExporting,
  onToggleEnabled: _onToggleEnabled,
  keyboardIndex: _keyboardIndex,
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
  // Available space = distance between markers - dropdown arrow - gaps - padding
  const sectionWidth = endX - startX;
  const dropdownArrowSpace = DROPDOWN_ARROW_WIDTH + GAP_WIDTH;
  const availableNameWidth = sectionWidth - dropdownArrowSpace - PADDING * 2;

  // Determine if we should show the name based on available space
  const showName = availableNameWidth >= MIN_NAME_WIDTH;

  // Constrain name width to available space (with reasonable bounds)
  const nameMaxWidth = Math.max(MIN_NAME_WIDTH, Math.min(availableNameWidth, 200));

  // Callback to track truncation state
  const handleTruncatedChange = useCallback((truncated: boolean) => {
    setIsTruncated(truncated);
  }, []);

  // Determine if section is disabled for styling
  const isDisabled = !section.enabled;

  return (
    <div
      className={`absolute flex items-center gap-1 transition-opacity ${isDisabled ? 'opacity-50' : ''}`}
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
            isTruncated={isTruncated}
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
      {/* Dropdown arrow for section actions menu */}
      <SectionDropdown items={[]} />
    </div>
  );
}
