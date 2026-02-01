# PRD: Marker Interaction Refinement and Undo/Redo

## Introduction

Markers define section boundaries and are actively manipulated by users via direct interaction on the waveform. As marker functionality has grown, several interaction behaviors need refinement to reduce ambiguity and improve usability. This feature clarifies marker hover/drag behavior, improves visual alignment of controls, and introduces undo/redo/reset support for editing actions.

## Goals

- Make marker interaction more predictable and easier to use
- Remove ambiguous "active" marker states (active only during drag)
- Improve discoverability of drag affordances (arrows visible on hover)
- Correct visual alignment of keyboard badge and close icon
- Allow users to safely experiment via undo/redo/reset

## User Stories

### US-001: Remove persistent marker active state
**Description:** As a user, I want markers to only appear "active" while I'm dragging them so the UI doesn't have confusing selected states.

**Acceptance Criteria:**
- [ ] Marker active state is entered only when user starts dragging
- [ ] Marker active state is exited immediately when drag ends
- [ ] Clicking a marker without dragging does not change its visual state
- [ ] No persistent "selected marker" concept exists in state
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Show drag arrows on marker hover
**Description:** As a user, I want to see drag arrows (<>) when I hover over a marker so I know I can drag it.

**Acceptance Criteria:**
- [ ] Drag arrows appear instantly on marker hover (no click required)
- [ ] Arrows are positioned to indicate horizontal drag direction
- [ ] Arrows disappear when hover ends
- [ ] Behavior is consistent across all markers
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Expand marker hover/drag area
**Description:** As a user, I want a slightly larger hit area for markers so they're easier to grab and drag.

**Acceptance Criteria:**
- [ ] Marker hover area extends ~4-6px beyond visible marker bounds
- [ ] Expanded area is invisible (hit-testing only, no visual change)
- [ ] Dragging can be initiated from anywhere within expanded area
- [ ] No unintended overlap with neighboring markers
- [ ] Expanded area does not interfere with section header UI
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Align keyboard badge and close icon correctly
**Description:** As a user, I want the keyboard number badge and close icon to be properly aligned above the marker.

**Acceptance Criteria:**
- [ ] Close (×) icon is centered directly above the marker line
- [ ] Keyboard mapping number (1-9) is positioned to the left of the close icon
- [ ] Both elements are horizontally aligned (same vertical position)
- [ ] Disabled sections do not display keyboard mapping label
- [ ] Layout remains stable during hover and drag interactions
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Implement undo/redo state management
**Description:** As a developer, I need an undo/redo system to track marker and section changes.

**Acceptance Criteria:**
- [ ] Create undo/redo hook or state manager (e.g., useUndoRedo or similar)
- [ ] Track state snapshots for: marker movement, creation, deletion, section enable/disable, section rename
- [ ] Support multiple undo/redo steps (linear history)
- [ ] Expose canUndo, canRedo, undo(), redo(), reset() from the hook
- [ ] History is cleared on reset
- [ ] Typecheck passes

### US-006: Add undo/redo keyboard shortcuts
**Description:** As a user, I want to use Cmd/Ctrl+Z to undo and Cmd/Ctrl+Shift+Z to redo.

**Acceptance Criteria:**
- [ ] Cmd/Ctrl+Z triggers undo
- [ ] Cmd/Ctrl+Shift+Z triggers redo
- [ ] Shortcuts are disabled during audio playback
- [ ] Shortcuts do nothing when history is empty (canUndo/canRedo is false)
- [ ] Shortcuts don't trigger when focus is in text input
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Add undo/redo/reset UI buttons
**Description:** As a user, I want visible buttons for undo, redo, and reset so I can access these actions without keyboard shortcuts.

**Acceptance Criteria:**
- [ ] Undo button with ↶ or similar icon
- [ ] Redo button with ↷ or similar icon
- [ ] Reset button with clear/trash icon or "Reset" text
- [ ] Undo button disabled when canUndo is false
- [ ] Redo button disabled when canRedo is false
- [ ] All buttons disabled during audio playback
- [ ] Buttons placed in toolbar/control area (near existing controls)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Add reset confirmation dialog
**Description:** As a user, I want a confirmation dialog before reset so I don't accidentally lose my work.

**Acceptance Criteria:**
- [ ] Clicking reset shows confirmation dialog
- [ ] Dialog message: "Reset all markers and sections? This cannot be undone."
- [ ] Dialog has "Cancel" and "Reset" buttons
- [ ] Cancel closes dialog without action
- [ ] Reset clears all markers/sections and closes dialog
- [ ] Reset bypasses undo history (cannot be undone)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Marker "active" state exists only during drag operation
- FR-2: Drag arrows (<>) appear on marker hover without click
- FR-3: Marker hover/drag hit area extends 4-6px beyond visible bounds
- FR-4: Close icon centered above marker; keyboard badge to the left
- FR-5: Undo reverts most recent action (marker move/create/delete, section enable/disable/rename)
- FR-6: Redo reapplies most recently undone action
- FR-7: Reset clears all markers/sections to empty state
- FR-8: Undo/redo accessible via Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z
- FR-9: Undo/redo/reset accessible via toolbar buttons
- FR-10: Undo/redo disabled during audio playback
- FR-11: Reset requires confirmation dialog
- FR-12: Reset clears undo/redo history (cannot be undone)

## Non-Goals

- Persisting undo/redo history across sessions
- Collaborative or multi-user editing
- Arbitrary history branching (non-linear undo)
- Undo/redo for zoom/pan or playback actions

## Design Considerations

- Drag arrows should be subtle but visible (match existing UI style)
- Undo/redo buttons should use standard icons (↶ ↷ or similar)
- Disabled button state should be visually obvious (opacity or grayed out)
- Confirmation dialog should match existing modal styling if present

## Technical Considerations

- Marker drag should be the sole source of "active" marker state
- Hover area expansion via hit-testing, not visual scaling
- Undo/redo via state snapshots or command pattern
- Consider using immer or similar for immutable state snapshots
- Reset bypasses undo history and initializes clean state
- Keyboard shortcut handling should check for input focus to avoid conflicts

## Success Metrics

- Markers are easier to grab on first attempt
- Users can confidently experiment knowing they can undo
- No confusion about "selected" vs "active" marker states
- Visual alignment of marker controls is pixel-perfect

## Open Questions

- ~~Should undo/redo be keyboard only or also UI buttons?~~ **Resolved: Both**
- ~~Should reset require confirmation?~~ **Resolved: Yes**
- ~~Should undo be disabled during playback?~~ **Resolved: Yes**
- Where exactly should the undo/redo/reset buttons be placed in the UI?

## Test File

For browser testing, use: `/Users/v.meijel/Downloads/Harder-Better-Faster-Stronger-by-Daft-Punk-2001-Stronger-by-.m4a`
