/**
 * Keyboard mapping constants for section playback shortcuts.
 * Supports 36 keys: digits 1-9, 0, then letters a-z.
 * Order: 1234567890qwertyuiopasdfghjklzxcvbnm
 */

/** Ordered string of all 36 supported keys for section playback */
export const KEY_ORDER = '1234567890qwertyuiopasdfghjklzxcvbnm';

/**
 * Get the key character for a given section index.
 * @param index - Zero-based index of the section
 * @returns The key character at that index, or undefined if out of range
 */
export function getKeyForIndex(index: number): string | undefined {
  if (index < 0 || index >= KEY_ORDER.length) {
    return undefined;
  }
  return KEY_ORDER[index];
}

/**
 * Get the section index for a given key character.
 * Key matching is case-insensitive.
 * @param key - The key character pressed
 * @returns The index in KEY_ORDER, or -1 if not found
 */
export function getIndexForKey(key: string): number {
  return KEY_ORDER.indexOf(key.toLowerCase());
}
