# PRD: Section Action Menu and Keyboard Mapping Feedback

## Introduction

Sections currently display their controls (download, enable/disable toggle) directly in the section header, creating visual clutter. Keyboard mappings (1-9) are functional but lack discoverability and feedback. This feature consolidates section actions into a dropdown menu and improves keyboard interaction visibility through better indicator placement and animated feedback on key press.

## Goals

- Reduce visual noise by moving section actions into a dropdown menu
- Make keyboard mappings more discoverable with clear visual indicators
- Provide immediate visual feedback when keyboard shortcuts are used
- Strengthen the connection between keyboard input and on-screen state

## User Stories

### US-001: Create section dropdown menu component
**Description:** As a developer, I need a reusable dropdown menu component for section actions.

**Acceptance Criteria:**
- [ ] Create dropdown menu component with open/close state
- [ ] Menu renders above other layers (z-index higher than waveform/control strip)
- [ ] Clicking outside the menu closes it
- [ ] Menu items are text-based (not icons)
- [ ] Typecheck passes

### US-002: Add dropdown trigger to section header
**Description:** As a user, I want to access section actions via a dropdown arrow next to the section name.

**Acceptance Criteria:**
- [ ] Dropdown arrow (▼) appears immediately after section name (inline)
- [ ] Arrow is visually lightweight but clearly clickable
- [ ] Clicking arrow opens the dropdown menu
- [ ] Dropdown accessible at all zoom levels
- [ ] Remove standalone download and enable/disable buttons from header
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Implement dropdown menu content
**Description:** As a user, I want the dropdown menu to show available actions and keyboard shortcut hints.

**Acceptance Criteria:**
- [ ] Menu shows "Download" action item
- [ ] Menu shows "Enable" or "Disable" based on current section state
- [ ] Menu shows keyboard shortcut number next to section (e.g., "1", "2")
- [ ] Clicking "Download" triggers export and closes menu
- [ ] Clicking "Enable/Disable" toggles state and closes menu
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Move keyboard mapping indicator to left marker
**Description:** As a user, I want to see which keyboard number triggers each section, displayed near the left marker.

**Acceptance Criteria:**
- [ ] Keyboard number (1-9) displayed next to left marker's close (×) icon
- [ ] Number styled as small badge with background (key cap style)
- [ ] Badge is smaller than marker but clearly readable
- [ ] Position is consistent relative to left marker across all sections
- [ ] Only enabled sections display a keyboard number
- [ ] Numbers update immediately when sections are enabled/disabled
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Add keyboard press visual feedback (blink animation)
**Description:** As a user, I want visual confirmation when I press a keyboard shortcut to play a section.

**Acceptance Criteria:**
- [ ] Pressing number key (1-9) causes corresponding keyboard badge to blink/highlight
- [ ] Animation is a short pulse (opacity or color change, ~200-300ms)
- [ ] Animation is noticeable but not distracting
- [ ] Only the section mapped to the pressed key responds visually
- [ ] Blink only occurs for enabled sections (disabled sections show no feedback)
- [ ] Animation is decoupled from playback logic (visual feedback is immediate)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Remove standalone download button from section header
- FR-2: Remove standalone enable/disable toggle from section header
- FR-3: Add dropdown arrow inline after section name
- FR-4: Dropdown menu contains: keyboard shortcut hint, "Download", "Enable/Disable"
- FR-5: Dropdown renders with z-index above waveform and control strip layers
- FR-6: Clicking menu item executes action immediately and closes menu
- FR-7: Clicking outside dropdown closes it without action
- FR-8: Keyboard number badge displayed next to left marker close icon
- FR-9: Badge styled as small key cap (background + number)
- FR-10: Disabled sections do not display keyboard number badge
- FR-11: Pressing mapped key triggers blink animation on corresponding badge
- FR-12: Blink animation only triggers for enabled sections

## Non-Goals

- Changing keyboard mapping logic (1-9 to enabled sections)
- Adding new section actions beyond existing (download, enable/disable)
- Supporting custom key bindings
- Persisting dropdown state across sessions

## Design Considerations

- Dropdown arrow should be visually lightweight (small, subtle color)
- Key cap badge should match overall dark theme (neutral background, light text)
- Blink animation should use cyan highlight to match existing active states
- Section headers must remain readable when dropdown is closed

## Technical Considerations

- Dropdown menu z-index: higher than z-20 (control strip), recommend z-30
- Keyboard feedback animation should use CSS transitions or requestAnimationFrame
- Animation trigger must be decoupled from playback state updates
- Keyboard badge position tied to marker position calculations (similar to existing marker controls)
- Consider using React state or ref for animation trigger to avoid re-renders

## Success Metrics

- Section headers are visually cleaner with fewer visible controls
- Users can access all section actions within 2 clicks
- Keyboard shortcut is discoverable via badge without documentation
- Visual feedback confirms keyboard input instantly

## Open Questions

- ~~Should the dropdown menu include keyboard shortcut hints?~~ **Resolved: Yes**
- ~~Should keyboard feedback trigger if playback is blocked?~~ **Resolved: No, only enabled sections**
- Should dropdown close on scroll/zoom, or stay open?
- What is the exact blink animation timing (150ms? 250ms? 300ms)?

## Test File

For testing, use: `/Users/v.meijel/Downloads/Harder-Better-Faster-Stronger-by-Daft-Punk-2001-Stronger-by-.m4a`
