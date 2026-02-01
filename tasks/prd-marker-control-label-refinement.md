# PRD: Marker Control Label Refinement

## Introduction

Markers display controls for deletion and keyboard mapping. Currently, both the close ("×") icon and the numeric keyboard mapping label are visible simultaneously. This refinement reduces visual noise by making the keyboard mapping label the primary visible state for enabled sections, while exposing the delete action only on hover.

## Goals

- Reduce visual clutter around markers
- Make keyboard mapping the primary visible state for enabled sections
- Keep marker deletion easily accessible but non-intrusive
- Clearly distinguish enabled vs disabled sections at a glance

## User Stories

### US-001: Show keyboard label as default for enabled sections
**Description:** As a user, I want to see the keyboard mapping number (1-9) as the default control above enabled section markers, so I know which key triggers playback.

**Acceptance Criteria:**
- [ ] Enabled sections show numeric keyboard label (1-9) above the left marker
- [ ] Close ("×") icon is NOT visible by default for enabled sections
- [ ] Label is clearly readable and centered above the marker line
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Show close icon on hover for enabled sections
**Description:** As a user, I want the close icon to appear when I hover over the keyboard label, so I can delete the marker without it always being visible.

**Acceptance Criteria:**
- [ ] Hovering over the keyboard label reveals the close ("×") icon
- [ ] The keyboard label is hidden when close icon is shown (only one visible at a time)
- [ ] Transition uses quick fade (100-150ms opacity)
- [ ] When hover ends, close icon fades out and keyboard label fades back in
- [ ] Close icon changes to red/danger color on hover (indicating destructive action)
- [ ] Clicking close icon deletes the marker
- [ ] Clicking keyboard label does NOT trigger deletion
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Always show close icon for disabled sections
**Description:** As a user, I want disabled sections to always show the close icon (no keyboard label), so I can clearly distinguish them from enabled sections.

**Acceptance Criteria:**
- [ ] Disabled sections show close ("×") icon by default (not keyboard label)
- [ ] No keyboard mapping number is ever shown for disabled sections
- [ ] Close icon remains visible on hover (no swap behavior)
- [ ] Close icon still changes to red/danger color on hover
- [ ] Cursor changes to `not-allowed` when hovering disabled marker control area
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Ensure stable hover interactions
**Description:** As a user, I want hover transitions to be stable without flickering, so the UI feels polished and predictable.

**Acceptance Criteria:**
- [ ] No flickering when transitioning between label and close icon
- [ ] Hover area matches the marker control area (not just the icon/label)
- [ ] Hover state is maintained while mouse is within control area
- [ ] Control does not interfere with marker drag behavior on the waveform below
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Enabled sections display keyboard mapping label (1-9) as default marker control
- FR-2: Enabled sections show close icon on hover, hiding the keyboard label
- FR-3: Label ↔ close icon transition uses 100-150ms opacity fade
- FR-4: Close icon changes to red/danger color on hover
- FR-5: Disabled sections always show close icon (no keyboard label)
- FR-6: Disabled sections use `not-allowed` cursor on control area
- FR-7: Only one control (label or close icon) is visible at a time
- FR-8: Clicking close icon deletes marker; clicking label does nothing

## Non-Goals

- Changing keyboard mapping logic
- Changing how markers are deleted (still single click)
- Adding confirmation dialogs for deletion
- Changing the keyboard blink animation behavior

## Design Considerations

- Numeric labels communicate "this marker is usable via keyboard"
- Close icon is a destructive action and should remain secondary
- Disabled state should feel explicit, not subtle
- Red/danger color for close icon hover reinforces destructive nature

## Technical Considerations

- Label ↔ close icon swap should be handled via state, not DOM replacement
- Disabled state must override hover behavior (no swap occurs)
- Z-index rules must ensure marker controls remain above waveform (z-20)
- Hover detection should use the control container, not individual elements
- Use CSS transitions for opacity fade (100-150ms)

## Success Metrics

- Visual clutter reduced - only one control visible per marker
- Clear distinction between enabled (shows number) and disabled (shows ×) sections
- No accidental deletions from hover/click confusion
- Smooth, flicker-free transitions

## Open Questions

- None - all questions resolved
