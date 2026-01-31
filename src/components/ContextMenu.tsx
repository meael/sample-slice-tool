import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  /** Label text for the menu item */
  label: string;
  /** Callback when menu item is clicked */
  onClick: () => void;
}

export interface ContextMenuProps {
  /** X position for the menu (in pixels from left) */
  x: number;
  /** Y position for the menu (in pixels from top) */
  y: number;
  /** Menu items to display */
  items: ContextMenuItem[];
  /** Callback when menu should close */
  onClose: () => void;
}

/**
 * A minimal context menu component that appears at a specified position
 * Closes when clicking outside or pressing Escape
 */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key or click outside
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Use setTimeout to prevent the context menu from immediately closing
    // due to the right-click event that opened it
    const timeoutId = setTimeout(() => {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust position if menu would overflow viewport
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if overflowing right edge
    if (rect.right > viewportWidth) {
      menu.style.left = `${viewportWidth - rect.width - 8}px`;
    }

    // Adjust vertical position if overflowing bottom edge
    if (rect.bottom > viewportHeight) {
      menu.style.top = `${viewportHeight - rect.height - 8}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-32 py-1 bg-neutral-800 border border-neutral-600 shadow-lg"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className="w-full px-3 py-1.5 text-left text-sm text-neutral-200 hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-none"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
