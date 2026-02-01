import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface SectionDropdownItem {
  /** Label text for the menu item */
  label: string;
  /** Callback when menu item is clicked */
  onClick: () => void;
}

export interface SectionDropdownProps {
  /** Menu items to display */
  items?: SectionDropdownItem[];
  /** Alternative: render custom children as menu content */
  children?: ReactNode;
  /** Optional trigger element (defaults to a dropdown arrow) */
  trigger?: ReactNode;
  /** Optional header text displayed at the top of the menu */
  header?: string;
}

/**
 * A dropdown menu component for section actions
 * Manages open/close state internally, closes when clicking outside
 */
export function SectionDropdown({ items, children, trigger, header }: SectionDropdownProps) {
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

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Use setTimeout to prevent immediate close from the click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  const handleItemClick = useCallback((onClick: () => void) => {
    onClick();
    setIsOpen(false);
  }, []);

  // Render function to close dropdown after action
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-flex items-center">
      {/* Trigger element */}
      <div
        className="flex items-center justify-center cursor-pointer select-none text-neutral-400 hover:text-neutral-200 transition-colors"
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {trigger ?? (
          <span className="text-xs" style={{ fontSize: 10 }}>▼</span>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full left-1/2 mt-1 py-1 rounded shadow-lg"
          style={{
            transform: 'translateX(-50%)',
            backgroundColor: '#1f1f1f',
            minWidth: 120,
            zIndex: 40, // Higher than control strip (z-30)
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Render header if provided */}
          {header && (
            <div className="px-3 py-1.5 text-neutral-400 text-xs border-b border-neutral-700">
              {header}
            </div>
          )}
          {/* Render items if provided */}
          {items?.map((item, index) => (
            <div
              key={index}
              className="px-3 py-1.5 text-neutral-200 text-xs cursor-pointer hover:bg-neutral-700"
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item.onClick);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {item.label}
            </div>
          ))}
          {/* Render children if provided (allows custom content) */}
          {children && (
            typeof children === 'function'
              ? (children as (close: () => void) => ReactNode)(closeDropdown)
              : children
          )}
        </div>
      )}
    </div>
  );
}
