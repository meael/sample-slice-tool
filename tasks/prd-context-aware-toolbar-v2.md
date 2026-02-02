# PRD: Context-Aware Toolbar v2

## Introduction

The editor currently displays all global controls in the header regardless of editor state. This creates visual noise and weak connection between editing actions and the waveform. This refinement introduces a context-aware toolbar that shows editing controls only when markers exist, positioned directly above the waveform with center alignment and no background.

## Goals

- Hide editing controls (Undo/Redo/Reset/Export All) until markers exist
- Position editing toolbar directly above waveform, center-aligned
- Keep "Load file" button separate in the header area
- Reserve vertical space for toolbar to prevent layout shifts
- Maintain Teenage Engineering–style clarity: no background, minimal, instrument-like

## User Stories

### US-001: Create EditorToolbar component with center alignment
**Description:** As a developer, I need a dedicated toolbar component that renders editing controls in a centered horizontal row above the waveform.

**Acceptance Criteria:**
- [ ] Create new file `src/components/EditorToolbar.tsx`
- [ ] Component accepts props: `canUndo`, `canRedo`, `onUndo`, `onRedo`, `onReset`, `onExportAll`, `hasMarkers`, `hasSections`, `disabled`
- [ ] Renders UndoRedoButtons and ExportAllButton in a single horizontal row
- [ ] Controls centered using `justify-center`
- [ ] Controls ordered: Undo → Redo → Reset → Export All
- [ ] Export All only visible when `hasSections` is true
- [ ] Component has fixed height `h-10` (40px) to reserve vertical space
- [ ] No background color - transparent/none
- [ ] Typecheck passes

### US-002: Implement context-aware toolbar visibility
**Description:** As a user, I want editing controls to only appear when I have markers, so the UI feels minimal when idle.

**Acceptance Criteria:**
- [ ] EditorToolbar shows empty reserved space when `hasMarkers` is false
- [ ] Undo/Redo/Reset buttons appear instantly when `hasMarkers` becomes true
- [ ] Export All appears when `hasSections` is true (2+ markers)
- [ ] Controls disappear instantly after reset clears all markers
- [ ] No fade animation - instant show/hide
- [ ] Toolbar container always renders (h-10) to prevent layout shifts
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Integrate toolbar above waveform in App layout
**Description:** As a user, I want the editing toolbar positioned directly above the waveform so it feels connected to my editing context.

**Acceptance Criteria:**
- [ ] Remove UndoRedoButtons from header section in App.tsx
- [ ] Remove ExportAllButton from header section in App.tsx
- [ ] Add EditorToolbar between header and MarkerControlStrip inside waveform container
- [ ] Header retains only FileLoaderButton and loading indicator
- [ ] EditorToolbar has same horizontal alignment as waveform content
- [ ] Pass all required props to EditorToolbar
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Verify no duplicate controls and clean layout
**Description:** As a developer, I need to ensure no duplicate controls exist and the layout is clean.

**Acceptance Criteria:**
- [ ] Only one instance of UndoRedoButtons exists (inside EditorToolbar)
- [ ] Only one instance of ExportAllButton exists (inside EditorToolbar)
- [ ] No stale imports or unused components
- [ ] Layout has no visual glitches or misalignments
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: EditorToolbar component with center-aligned controls and fixed height
- FR-2: Toolbar has no background (transparent)
- FR-3: Controls hidden when `markers.length === 0`; toolbar space remains
- FR-4: Export All visible only when `sections.length > 0`
- FR-5: Control order: Undo → Redo → Reset → Export All
- FR-6: Header contains only Load File button
- FR-7: Toolbar positioned between header and waveform area

## Non-Goals

- No new global actions added
- No changes to export behavior or formats
- No persistence of toolbar state across sessions
- No animation/transition effects

## Design Considerations

### Layout Structure
```
┌─────────────────────────────────────────┐
│ Header: [Load File]                     │  ← Always visible
├─────────────────────────────────────────┤
│     [Undo] [Redo] [Reset] [Export]      │  ← Centered, no bg, h-10
│         (empty when no markers)         │
├─────────────────────────────────────────┤
│ MarkerControlStrip                      │
├─────────────────────────────────────────┤
│ WaveformCanvas                          │
└─────────────────────────────────────────┘
```

### Toolbar States
| State | Visible Controls |
|-------|------------------|
| No markers | (empty - reserved h-10 space) |
| Has markers, no sections | Undo, Redo, Reset |
| Has markers + sections | Undo, Redo, Reset, Export All |

### Styling
- Height: `h-10` (40px) fixed
- Background: none/transparent
- Alignment: `flex justify-center items-center`
- Gap between controls: `gap-1` or `gap-2`

## Technical Considerations

- Toolbar visibility derived from `markers.length > 0`
- Export All visibility derived from `sections.length > 0`
- Fixed height prevents layout shifts when controls appear/disappear
- All icons already use Lucide React (no Unicode)

## Success Metrics

- UI feels minimal and "quiet" when no markers exist
- Editing controls appear contextually when editing begins
- No layout jumps when toolbar content changes
- Toolbar reads as part of the waveform editor, not a global header

## Open Questions

None - all requirements specified.
