# PRD: Atomic Marker Drag Undo

## Introduction

Marker drag operations currently create multiple undo history entries for intermediate positions during a drag. This results in unpredictable undo behavior where users must press undo multiple times to revert a single drag action. This fix ensures marker dragging is treated as a single atomic operation in the undo history.

## Goals

- Make marker drag undo behavior predictable and editor-grade
- Single undo fully reverts one drag action
- Align with standard behavior in audio/timeline/design editors

## User Stories

### US-001: Implement atomic undo for marker drag
**Description:** As a user, I want undo to restore a dragged marker to its exact position before I started dragging, so that undo behaves predictably.

**Acceptance Criteria:**
- [ ] Dragging a marker and pressing undo restores marker to its pre-drag position in one step
- [ ] Redo restores marker to its post-drag position in one step
- [ ] No intermediate drag positions are stored in undo history
- [ ] Rapid small drags (drag, release, drag, release) each create separate undo entries
- [ ] Other marker operations (add, delete, rename, enable/disable) continue to work normally
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Capture marker position when drag starts (mousedown on marker)
- FR-2: Do NOT create undo history entries during drag (mousemove)
- FR-3: Create single undo history entry when drag ends (mouseup), storing from/to positions
- FR-4: Undo restores marker to pre-drag position
- FR-5: Redo restores marker to post-drag position

## Non-Goals

- Atomic undo for other operations (section rename typing, rapid toggles)
- Visual indication of "uncommitted" drag state
- Changes to drag behavior or constraints

## Technical Considerations

- The `useUndoRedo` hook currently captures state on every `setState` call
- Need to add a way to update state without creating history (for intermediate drag positions)
- Options:
  1. Add `setStateWithoutHistory` function to `useUndoRedo`
  2. Add `commitToHistory` flag/function that batches updates
  3. Track drag state separately and only commit on drag end
- `WaveformCanvas.tsx` handles marker drag via `handleMouseDown`, `handleMouseMove`, `handleMouseUp`
- `useMarkers.ts` exposes `updateMarker(id, time)` which currently creates history entry

## Success Metrics

- Single undo fully reverts any marker drag
- User testing confirms behavior matches expectations

## Open Questions

- None - requirements are clear
