# PRD: Marker Playback Controls and Keyboard Interaction

## Introduction

Extend the existing marker functionality to support keyboard-driven playback of audio segments. Each marker defines the start of a segment that plays until the next marker (or end of audio). Users can trigger playback via number keys (1-9), pause/resume with spacebar, and cancel with Escape. Visual feedback includes number badges on markers and a waveform fill effect showing playback progress.

This enables fast, repeatable review of specific audio segments without complex controls.

## Goals

- Position marker controls (close icons, number badges) above the waveform on a dedicated strip
- Enable keyboard-based playback of marker segments (keys 1-9)
- Support spacebar pause/resume and Escape to stop
- Provide smooth audio transitions with fade-out when switching segments
- Show playback progress via waveform fill effect

## User Stories

### US-001: Create marker control strip above waveform
**Description:** As a user, I want marker controls displayed above the waveform so they don't obscure the audio visualization.

**Acceptance Criteria:**
- [ ] Horizontal strip with solid black background renders above waveform canvas
- [ ] Strip height sufficient for close icons and number badges (~24-32px)
- [ ] Strip spans full width of waveform
- [ ] Clear visual separation between control strip and waveform
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-002: Move close icons to control strip
**Description:** As a user, I want close icons positioned in the control strip above the waveform so they're always accessible.

**Acceptance Criteria:**
- [ ] Close ("×") icons render in the control strip, not on the waveform
- [ ] Icons are horizontally aligned with their corresponding marker positions
- [ ] Icons remain clickable and delete the marker on click
- [ ] Icons have hover feedback (pointer cursor, visual state change)
- [ ] Click events do not propagate to waveform
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Display number badges (1-9) on markers
**Description:** As a user, I want to see which number key corresponds to each marker so I can trigger playback quickly.

**Acceptance Criteria:**
- [ ] Each marker displays a number badge (1-9) in the control strip
- [ ] Numbers assigned in ascending order by marker time position
- [ ] Badge is visually distinct (e.g., small rounded rectangle or circle)
- [ ] Maximum 9 markers supported (additional markers get no badge)
- [ ] Numbers update when markers are added/removed/reordered
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Create audio playback service
**Description:** As a developer, I need a service to handle audio segment playback with fade-out support.

**Acceptance Criteria:**
- [ ] PlaybackService or hook manages audio playback state
- [ ] Can play a segment given start time and end time
- [ ] Supports fade-out via Web Audio API gain node (100-300ms duration)
- [ ] Exposes current playback state: idle, playing, paused
- [ ] Exposes current playback time for progress calculation
- [ ] Can stop playback immediately or with fade
- [ ] Typecheck passes

---

### US-005: Implement keyboard playback (keys 1-9)
**Description:** As a user, I want to press number keys 1-9 to instantly play the corresponding marker's segment.

**Acceptance Criteria:**
- [ ] Pressing 1-9 triggers playback of the corresponding marker segment
- [ ] Segment plays from marker position to next marker (or end of audio)
- [ ] Pressing unmapped numbers (no marker) has no effect
- [ ] Keyboard listener ignores events when input/textarea is focused
- [ ] Works regardless of waveform focus state
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Implement playback switching with fade-out
**Description:** As a user, I want smooth transitions when switching between segments so audio doesn't overlap or cut harshly.

**Acceptance Criteria:**
- [ ] Playing a new segment while another is playing fades out current segment
- [ ] Fade-out duration 100-300ms via gain node ramp
- [ ] New segment starts immediately after fade begins (no delay)
- [ ] Only one segment plays at a time (no overlap)
- [ ] Playback state always reflects most recently triggered marker
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Implement spacebar pause/resume
**Description:** As a user, I want to pause and resume playback with the spacebar for quick control.

**Acceptance Criteria:**
- [ ] Spacebar pauses active playback
- [ ] Spacebar resumes paused playback from current position
- [ ] Spacebar has no effect when idle (no segment playing)
- [ ] Keyboard listener ignores events when input/textarea is focused
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Implement Escape to stop playback
**Description:** As a user, I want to press Escape to immediately stop playback and reset to idle state.

**Acceptance Criteria:**
- [ ] Escape key stops any active or paused playback
- [ ] Audio stops immediately (no fade required)
- [ ] Playback state resets to idle
- [ ] Progress indicator clears
- [ ] Works consistently regardless of how playback was started
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Show playback progress with waveform fill
**Description:** As a user, I want to see playback progress as a fill effect on the waveform so I know how much of the segment has played.

**Acceptance Criteria:**
- [ ] During playback, waveform area for active segment shows fill overlay
- [ ] Fill progresses from segment start to current playback position
- [ ] Fill color is distinct but not overpowering (e.g., semi-transparent highlight)
- [ ] Fill updates smoothly (~60fps) in sync with audio playback
- [ ] Fill clears when playback stops, completes, or is canceled
- [ ] Only active segment shows fill (other segments remain normal)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Handle segment completion
**Description:** As a user, I want playback to stop automatically when the segment ends.

**Acceptance Criteria:**
- [ ] Playback stops when reaching the end of the segment (next marker or audio end)
- [ ] Playback state returns to idle
- [ ] Progress fill clears
- [ ] No audio continues after segment end
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Render a control strip (black background, ~24-32px height) above the waveform canvas
- FR-2: Position marker close icons in the control strip, aligned with marker positions
- FR-3: Display number badges (1-9) next to each marker's close icon in ascending time order
- FR-4: Implement PlaybackService using Web Audio API with gain node for fade control
- FR-5: Map keyboard keys 1-9 to markers in time-sorted order for playback
- FR-6: Play segment from marker position to next marker position (or audio end for last marker)
- FR-7: Fade out current segment (100-300ms) when switching to another segment
- FR-8: Spacebar toggles pause/resume for active playback
- FR-9: Escape key stops playback immediately and resets state to idle
- FR-10: Show playback progress as waveform fill from segment start to current position
- FR-11: Update progress fill at ~60fps during playback
- FR-12: Clear progress fill when playback stops, completes, or is canceled
- FR-13: Ignore keyboard events when an input or textarea element is focused

## Non-Goals

- Manual editing of marker ranges (already exists, unchanged)
- Supporting more than 9 markers for keyboard playback
- Persisting keyboard mappings beyond current session
- Advanced audio effects beyond fade-out
- Looping playback
- Playback speed control

## Design Considerations

**Control Strip:**
- Solid black background (#000000 or similar dark)
- Height: 24-32px
- Close icons: existing "×" style, light color for contrast
- Number badges: small rounded rectangles or circles, monospace font

**Progress Fill:**
- Semi-transparent overlay color (e.g., rgba(0, 255, 255, 0.2) or similar)
- Fills waveform area from left edge of segment to current playback position
- Should not obscure waveform details significantly

**Visual States:**
- Idle: no fill, markers show numbers
- Playing: progress fill animates, active marker highlighted
- Paused: progress fill frozen at current position

## Technical Considerations

**Audio Playback:**
- Use Web Audio API `AudioContext` and `AudioBufferSourceNode`
- Implement fade-out via `GainNode.gain.linearRampToValueAtTime()`
- Track playback position using `AudioContext.currentTime`
- Store reference to current source node for stop/fade operations

**Keyboard Handling:**
- Add global keydown listener (document level)
- Check `event.target` to ignore when input/textarea focused
- Prevent default for handled keys to avoid browser shortcuts

**Progress Animation:**
- Use `requestAnimationFrame` for smooth updates
- Calculate progress: `(currentTime - segmentStart) / segmentDuration`
- Render fill overlay on canvas or as positioned div

**Marker Index Assignment:**
- Sort markers by time position
- Assign indices 0-8 (keys 1-9)
- Reassign on marker add/remove

## Success Metrics

- Keyboard playback triggers within 50ms of key press
- Audio fade transitions feel smooth (no clicks or pops)
- Progress fill stays in sync with audio (< 50ms drift)
- No overlapping audio when rapidly switching segments
- Users can trigger 10+ segment plays in quick succession without issues

## Open Questions

1. Should the progress fill have a different style when paused vs playing?
2. Should there be any visual indication on the number badge when that segment is playing?
3. What should happen if a marker is deleted while its segment is playing?
