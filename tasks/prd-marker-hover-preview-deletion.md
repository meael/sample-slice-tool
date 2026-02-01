# PRD: Marker Hover Preview and Deletion

## Introduction

Enhance the existing marker placement experience on the audio waveform with two UX improvements: (1) a visual preview marker that follows the cursor on hover, making placement more predictable, and (2) a close icon on each placed marker for direct deletion without context menus or keyboard shortcuts.

This is a UI/UX enhancement only—no changes to audio playback, waveform generation, or marker persistence logic.

## Goals

- Show a semi-transparent marker preview at the cursor position when hovering the waveform
- Allow users to delete any marker via a visible close icon
- Keep interactions lightweight and discoverable without additional UI panels
- Maintain support for multiple markers (existing behavior)

## User Stories

### US-001: Show marker preview on waveform hover
**Description:** As a user, I want to see a preview of where a marker will be placed when I hover over the waveform, so I can position it accurately before clicking.

**Acceptance Criteria:**
- [ ] Semi-transparent marker preview (50% opacity) appears when cursor enters waveform area
- [ ] Preview uses the same visual shape as placed markers (vertical line)
- [ ] Preview position updates smoothly as cursor moves horizontally
- [ ] Preview accurately reflects the timestamp that would be set on click
- [ ] No visual jitter or lag while moving cursor
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-002: Hide preview when hovering existing markers
**Description:** As a user, I don't want to see the preview marker when my cursor is over an existing marker, so the UI stays uncluttered.

**Acceptance Criteria:**
- [ ] Preview marker is hidden when cursor is within the hit area of an existing marker (~10px)
- [ ] Preview reappears when cursor moves away from existing markers
- [ ] Transition is immediate (no fade in/out needed)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Hide preview when cursor leaves waveform
**Description:** As a user, I expect the preview to disappear when I move my cursor outside the waveform area.

**Acceptance Criteria:**
- [ ] Preview marker disappears when cursor leaves waveform bounds
- [ ] No lingering preview artifacts
- [ ] Preview reappears when cursor re-enters waveform
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Add close icon to placed markers
**Description:** As a user, I want a visible close icon on each marker so I can delete it with a single click.

**Acceptance Criteria:**
- [ ] Each placed marker displays a close ("×") icon
- [ ] Icon is positioned above the marker line, horizontally centered
- [ ] Icon is always visible (not hover-only)
- [ ] Icon is visually distinct from the marker line (e.g., small circle with ×)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Delete marker via close icon click
**Description:** As a user, I want to click the close icon to remove a marker immediately.

**Acceptance Criteria:**
- [ ] Clicking the close icon deletes the associated marker
- [ ] Marker is removed from UI immediately
- [ ] Click does not trigger waveform click (no new marker placed)
- [ ] Click does not trigger marker selection or drag
- [ ] Works correctly for any marker (not just selected marker)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Close icon hover feedback
**Description:** As a user, I want visual feedback when hovering the close icon so I know it's interactive.

**Acceptance Criteria:**
- [ ] Cursor changes to pointer when hovering close icon
- [ ] Close icon shows hover state (e.g., brighter color or increased opacity)
- [ ] Hover state is distinct from default state
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Render a preview marker at cursor position when hovering the waveform canvas
- FR-2: Preview marker must use 50% opacity to differentiate from placed markers
- FR-3: Preview marker must use the same vertical line shape as placed markers
- FR-4: Preview marker must be hidden when cursor is within 10px of an existing marker
- FR-5: Preview marker must disappear when cursor leaves the waveform area
- FR-6: Each placed marker must display a close ("×") icon above the marker line
- FR-7: Close icon must be always visible (not hover-only)
- FR-8: Clicking close icon must delete the marker without triggering other click handlers
- FR-9: Close icon must show pointer cursor and hover state on mouse over
- FR-10: Event propagation must be stopped on close icon click to prevent waveform/marker click conflicts

## Non-Goals

- Keyboard shortcuts for deletion (existing Delete/Backspace behavior remains separate)
- Changing marker persistence or storage logic
- Changing marker placement time calculation
- Accessibility improvements (screen reader support, focus management)
- Animation or transitions for preview/deletion
- Changing to single-marker mode (multiple markers remain supported)

## Design Considerations

**Preview Marker:**
- Same vertical line as placed markers
- 50% opacity
- Same color as placed markers (consistency)

**Close Icon:**
- Small "×" character or icon
- Positioned centered above marker line
- Background circle or pill for visibility against waveform
- Colors: neutral gray default, brighter on hover
- Size: ~16-20px clickable area minimum

**Cursor Behavior:**
- Default/crosshair cursor over waveform (existing)
- Pointer cursor over close icon
- Grab cursor over marker line (existing drag behavior)

## Technical Considerations

**Existing code to reuse:**
- `WaveformCanvas.tsx` — add preview rendering and close icon
- `useMarkers.ts` — use existing `deleteMarker` function
- Marker rendering logic — reuse for preview with opacity modifier

**Event handling:**
- Track mouse position via `onMouseMove` on canvas container
- Use `onMouseLeave` to hide preview
- Stop propagation on close icon click to prevent:
  - Waveform click (would place new marker)
  - Marker selection
  - Marker drag initiation

**State:**
- Preview position: local component state (not persisted)
- `hoverTime: number | null` — null when cursor outside or over existing marker

**Performance:**
- Preview rendering should use requestAnimationFrame if needed
- Avoid re-rendering entire waveform on mouse move

## Success Metrics

- Marker placement feels more predictable with visual preview
- Users can delete markers without right-click or keyboard
- No accidental marker repositioning when deleting
- No performance regression on mouse movement

## Open Questions

- Should the close icon have a tooltip ("Delete marker")?
- Should there be a brief fade-out animation when deleting a marker?
