# PRD: Section Validity, Layout Corrections, and Visual Hierarchy

## Introduction

Refine how audio sections are defined, displayed, and interacted with on the waveform. A section is only valid when bounded by two consecutive markers. Areas outside valid sections (before the first marker, after the last marker) are rendered as inactive/muted. Section names and export buttons are repositioned to appear between their defining markers rather than above a single marker. Z-index issues are fixed so section controls are always accessible.

## Goals

- Define sections strictly as ranges between two consecutive markers
- Render inactive waveform areas (before first marker, after last marker) in grayscale/muted style
- Position section names and export buttons between their defining markers in the control strip
- Keep delete icons positioned above their respective markers (unchanged)
- Support truncated names with popover editing when space is limited
- Fix z-index layering so section controls are always visible and clickable

## User Stories

### US-001: Define section validity logic
**Description:** As a developer, I need clear logic for determining which waveform ranges are valid sections.

**Acceptance Criteria:**
- [ ] A section exists only between two consecutive markers (marker N and marker N+1)
- [ ] Range before first marker is NOT a section
- [ ] Range after last marker is NOT a section
- [ ] Single marker alone does not create a section
- [ ] Create helper function: getSections(markers, duration) returns array of {startMarker, endMarker, startTime, endTime}
- [ ] Typecheck passes

---

### US-002: Render inactive waveform areas in grayscale
**Description:** As a user, I want to clearly see which parts of the waveform are not valid sections.

**Acceptance Criteria:**
- [ ] Waveform before first marker rendered in grayscale (desaturated)
- [ ] Waveform after last marker rendered in grayscale (desaturated)
- [ ] Active sections (between markers) rendered in normal color
- [ ] Grayscale achieved via desaturation, not just opacity
- [ ] Visual distinction is clear but not distracting
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Disable section interactions for inactive areas
**Description:** As a user, I should not be able to play, export, or name inactive waveform areas.

**Acceptance Criteria:**
- [ ] Keyboard playback (1-9) only works for valid sections
- [ ] No export button shown for inactive areas
- [ ] No section name shown for inactive areas
- [ ] Clicking in inactive area does not trigger section playback
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Reposition section name between markers
**Description:** As a user, I want section names displayed between the two markers that define the section.

**Acceptance Criteria:**
- [ ] Section name positioned horizontally centered between start and end marker
- [ ] Name displayed in control strip (not on waveform)
- [ ] Name visually aligned with section's horizontal span
- [ ] Delete icons remain positioned above their respective markers (unchanged)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Reposition export button next to section name
**Description:** As a user, I want the export button grouped with the section name between markers.

**Acceptance Criteria:**
- [ ] Export button positioned immediately to the right of section name
- [ ] Name and button form a visual group (small gap, e.g., 4-8px)
- [ ] Button moves with name when zooming/panning
- [ ] Button does not overlap with markers or other controls
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Implement name truncation based on available space
**Description:** As a user, I want section names to truncate gracefully when there isn't enough space between markers.

**Acceptance Criteria:**
- [ ] Calculate available width between markers minus button width
- [ ] If name fits, show full name
- [ ] If name doesn't fit, truncate with ellipsis
- [ ] Truncation based on actual rendered width, not character count
- [ ] Minimum display: at least first few characters + ellipsis (or hide if too small)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Add popover for editing truncated names
**Description:** As a user, I want to click on a truncated name to see and edit the full name in a popover.

**Acceptance Criteria:**
- [ ] Clicking truncated name opens floating popover/tooltip
- [ ] Popover shows full name in editable input field
- [ ] Input pre-filled with current name, text selected
- [ ] Enter saves, Escape cancels, blur saves
- [ ] Popover positioned near the name, doesn't overflow viewport
- [ ] Popover only appears when name is truncated (full names edit inline as before)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Fix z-index layering for section controls
**Description:** As a user, I want section controls to always be visible and clickable above the waveform.

**Acceptance Criteria:**
- [ ] Control strip has explicit z-index higher than waveform canvas
- [ ] Section name and export button are never obscured by waveform
- [ ] Popovers/tooltips have highest z-index
- [ ] No click events intercepted by waveform when clicking controls
- [ ] Consistent behavior across zoom levels
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Remove number badges from control strip
**Description:** As a developer, I need to remove keyboard number badges since playback now uses section indices, not marker indices.

**Acceptance Criteria:**
- [ ] Number badges (1-9) removed from marker control strip
- [ ] Keyboard playback remapped: key 1 = section 1 (between marker 0 and 1), etc.
- [ ] Section-based numbering shown if needed (or omitted for cleaner UI)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Update keyboard playback for section-based indices
**Description:** As a user, I want keyboard shortcuts to play sections, not marker-based ranges.

**Acceptance Criteria:**
- [ ] Key 1 plays section 1 (audio between marker 0 and marker 1)
- [ ] Key 2 plays section 2 (audio between marker 1 and marker 2)
- [ ] Key N plays section N if it exists
- [ ] Pressing key for non-existent section does nothing
- [ ] Maximum 9 sections playable via keyboard (keys 1-9)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Section is valid only when bounded by two consecutive markers
- FR-2: Waveform before first marker rendered in grayscale
- FR-3: Waveform after last marker rendered in grayscale
- FR-4: Active sections rendered in normal waveform color
- FR-5: Section name positioned horizontally centered between its two markers
- FR-6: Export button positioned immediately right of section name
- FR-7: Delete icons remain above their respective markers
- FR-8: Section name truncates with ellipsis when space insufficient
- FR-9: Clicking truncated name opens popover for full name editing
- FR-10: Control strip z-index higher than waveform canvas
- FR-11: Keyboard keys 1-9 play sections (not marker-based ranges)
- FR-12: Inactive areas cannot be played, exported, or named

## Non-Goals

- Changing how markers are created or edited
- Introducing new section types (e.g., overlapping sections)
- Adding new export formats or options
- Changing marker delete functionality
- Adding section-specific styling beyond active/inactive distinction

## Design Considerations

**Inactive Waveform:**
- Grayscale/desaturated version of normal waveform color
- Achieved via canvas rendering with desaturated color or filter
- Should look "faded" but still show audio shape

**Section Header Layout:**
```
[Delete] ---- [Section Name] [↓] ---- [Delete]
   ^                                      ^
 Marker 1                              Marker 2
```
- Delete icons stay above markers
- Name + export button centered between markers

**Truncation:**
- Measure available width: `marker2X - marker1X - buttonWidth - padding`
- If `nameWidth > availableWidth`, truncate
- Show popover on click for truncated names only

**Z-Index Stack:**
1. Waveform canvas (base)
2. Control strip (above waveform)
3. Popovers/tooltips (highest)

## Technical Considerations

**Section Calculation:**
```typescript
interface Section {
  id: string;
  startMarker: Marker;
  endMarker: Marker;
  startTime: number;
  endTime: number;
  name: string; // inherited from startMarker
}

function getSections(markers: Marker[], duration: number): Section[]
```

**Grayscale Rendering:**
- Option 1: Draw inactive regions with grayscale color derived from waveform color
- Option 2: Use canvas compositing or CSS filter
- Recommendation: Calculate grayscale RGB values and draw separately

**Truncation Detection:**
- Use canvas `measureText()` or create hidden span to measure actual text width
- Compare against available space calculated from marker positions

**Popover Positioning:**
- Position below or above the name depending on available space
- Use fixed/absolute positioning with calculated coordinates
- Ensure popover doesn't clip at viewport edges

## Success Metrics

- Inactive areas clearly distinguishable at a glance
- Section names always readable or accessible via popover
- No z-index issues reported (controls always clickable)
- Keyboard playback intuitive (key 1 = first section)

## Open Questions

1. Should inactive areas have any interactivity (e.g., click to add marker)?
2. Should section numbers (1, 2, 3...) be displayed alongside names?
3. What happens if there are 0 markers or only 1 marker (no valid sections)?
