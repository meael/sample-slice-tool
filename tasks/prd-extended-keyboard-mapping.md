# PRD: Extended Keyboard Mapping

## Introduction

Extend keyboard shortcuts for section playback beyond the current 1-9 limit. Use digits followed by letters (qwerty rows) to support up to 36 enabled sections with keyboard triggers. Mapping is deterministic based on enabled sections sorted by start time.

## Goals

- Increase mappable sections from 9 to 36
- Use only digits and letters (no symbols)
- Keep mapping deterministic: enabled sections sorted by start time
- Update UI labels to show letters (uppercase for clarity)
- Maintain blink feedback animation for all mapped keys

## User Stories

### US-001: Create shared KEY_ORDER constant
**Description:** As a developer, I need a centralized key order constant so keyboard mapping is consistent across components.

**Acceptance Criteria:**
- [ ] Create `src/constants/keyboardMapping.ts` with `KEY_ORDER = "1234567890qwertyuiopasdfghjklzxcvbnm"`
- [ ] Export helper function `getKeyForIndex(index: number): string | undefined`
- [ ] Export helper function `getIndexForKey(key: string): number` (returns -1 if not found)
- [ ] Keys are case-insensitive (normalize to lowercase internally)
- [ ] Typecheck passes

### US-002: Update useKeyboardControls to handle extended keys
**Description:** As a user, I want to press letter keys to trigger sections beyond the first 9.

**Acceptance Criteria:**
- [ ] Import KEY_ORDER from constants
- [ ] Replace `key >= '1' && key <= '9'` check with KEY_ORDER.includes(key.toLowerCase())
- [ ] Use `getIndexForKey()` to find section index
- [ ] Update `onSectionKeyPressed` callback to pass the key string instead of number
- [ ] Ignore key events when user is in input/textarea (existing behavior)
- [ ] Typecheck passes

### US-003: Update MarkerControlStrip keyboard mapping
**Description:** As a developer, I need the marker keyboard index map to support 36 keys.

**Acceptance Criteria:**
- [ ] Import KEY_ORDER and getKeyForIndex from constants
- [ ] Change `getKeyboardIndexMap` to return `Map<string, string>` (section ID → key character)
- [ ] Remove the `index < 9` limit, use `index < KEY_ORDER.length`
- [ ] Store uppercase key character for display (e.g., "Q" not "q")
- [ ] Update `markerKeyboardIndexMap` types accordingly
- [ ] Typecheck passes

### US-004: Update keyboard label display for letters
**Description:** As a user, I want to see the correct key label (digit or letter) on each enabled section.

**Acceptance Criteria:**
- [ ] Label shows uppercase letter for letter keys (Q, W, E, etc.)
- [ ] Label shows digit for number keys (1-9, 0)
- [ ] Sections beyond 36 enabled sections show no label (empty)
- [ ] Title attribute shows "Press Q to play" (uppercase)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Update blink animation for extended keys
**Description:** As a user, I want the blink animation to work for letter keys too.

**Acceptance Criteria:**
- [ ] Update App.tsx `pressedKeyboardIndex` state to `pressedKeyboardKey: string | null`
- [ ] Update `handleSectionKeyPressed` to receive key string
- [ ] Pass `pressedKeyboardKey` to MarkerControlStrip
- [ ] Blink animation triggers when `pressedKeyboardKey === keyboardKey` (case-insensitive)
- [ ] Auto-clear pressed key after animation (existing 150ms timeout)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: KEY_ORDER = "1234567890qwertyuiopasdfghjklzxcvbnm" (36 keys total)
- FR-2: Enabled sections mapped in order of start time
- FR-3: First enabled section → "1", second → "2", ..., 10th → "0", 11th → "Q", etc.
- FR-4: Sections beyond index 35 have no key assigned (no label, no keyboard trigger)
- FR-5: Key matching is case-insensitive
- FR-6: UI labels display uppercase for letters
- FR-7: Blink animation works for all mapped keys

## Non-Goals

- Custom key binding by user
- Locale-specific keyboard layouts
- Symbol keys (-, =, [, ], etc.)
- Modifier key combinations for section playback

## Technical Considerations

- `useKeyboardControls.ts` - Update key detection logic
- `MarkerControlStrip.tsx` - Update mapping and display
- `App.tsx` - Update pressed key state type
- Create new `src/constants/keyboardMapping.ts` for shared constant
- Use `event.key` (character-based), not `event.code` (physical key)

## Success Metrics

- Users can trigger up to 36 sections via keyboard
- No key collisions
- Immediate visual feedback on key press
- Labels always match actual mapping
