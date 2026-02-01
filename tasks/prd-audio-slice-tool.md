# PRD: Audio Slice Tool — Phase 1 (MVP-0)

## Introduction

Build a minimal, browser-based audio slicing tool that allows users to load an audio file, view its waveform, and place/move/delete markers. This phase focuses exclusively on visual inspection and manual marker placement—no playback, no export, no auto-slicing.

The tool should feel like a digital instrument: clean, precise, and calm. If a user needs a tutorial, the phase has failed.

**Stack:** React + TypeScript, Canvas 2D, Tailwind CSS
**Target:** Modern browsers (Chrome, Firefox, Safari, Edge — latest 2 versions)

## Goals

- Load and decode audio files (WAV, MP3, M4A, AAC, FLAC) entirely client-side
- Render an accurate, full-width waveform visualization using Canvas 2D
- Enable smooth zooming centered on cursor position (mouse wheel + trackpad)
- Provide intuitive marker interactions: add (click), move (drag), delete (keyboard/context menu)
- Deliver a minimal UI with zero unnecessary elements
- Work offline after initial page load

## User Stories

### US-001: Project setup and scaffolding
**Description:** As a developer, I need a React + TypeScript project with Tailwind CSS configured so I can begin building components.

**Acceptance Criteria:**
- [ ] React 18+ with TypeScript configured
- [ ] Tailwind CSS installed and configured
- [ ] Development server runs without errors
- [ ] Production build works
- [ ] Basic folder structure: `src/components`, `src/hooks`, `src/services`, `src/types`
- [ ] Typecheck passes (`tsc --noEmit`)

---

### US-002: Audio file drop zone
**Description:** As a user, I want to drag & drop an audio file onto the page so I can load it quickly.

**Acceptance Criteria:**
- [ ] Full-page drop zone visible on initial load
- [ ] Visual feedback when dragging file over drop zone (e.g., border highlight)
- [ ] Accepts WAV, MP3, M4A, AAC, FLAC files only
- [ ] Shows error message for unsupported file types
- [ ] Drop zone hides after successful file load
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Audio file picker fallback
**Description:** As a user, I want a file picker button as an alternative to drag & drop.

**Acceptance Criteria:**
- [ ] "Choose file" button visible in drop zone
- [ ] Opens native file picker filtered to supported audio types
- [ ] Loads file on selection
- [ ] Drop zone hides after successful load
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Audio decoding service
**Description:** As a developer, I need a service to decode audio files into usable audio data using the Web Audio API.

**Acceptance Criteria:**
- [ ] `AudioService` class/module that accepts a File and returns decoded AudioBuffer
- [ ] Handles all 5 supported formats (WAV, MP3, M4A, AAC, FLAC)
- [ ] Returns error for unsupported/corrupted files
- [ ] Exposes audio metadata: duration, sample rate, number of channels
- [ ] Typecheck passes

---

### US-005: Waveform data extraction
**Description:** As a developer, I need to extract waveform peak data from the AudioBuffer for rendering.

**Acceptance Criteria:**
- [ ] Function to downsample AudioBuffer to peaks array for given resolution
- [ ] Supports mono and stereo (combine channels or use first channel)
- [ ] Returns normalized values (-1 to 1)
- [ ] Performant for files up to 10 minutes
- [ ] Typecheck passes

---

### US-006: Basic waveform canvas rendering
**Description:** As a user, I want to see the audio waveform displayed so I can visually inspect the audio.

**Acceptance Criteria:**
- [ ] Full-width Canvas element renders waveform
- [ ] Waveform is horizontally centered in viewport
- [ ] Accurate amplitude representation (peaks visible)
- [ ] High contrast waveform color against background
- [ ] Responsive: re-renders on window resize
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Zoom with mouse wheel
**Description:** As a user, I want to zoom in/out on the waveform using my mouse wheel so I can inspect details.

**Acceptance Criteria:**
- [ ] Mouse wheel up = zoom in, wheel down = zoom out
- [ ] Zoom centered on cursor horizontal position
- [ ] Minimum zoom: full waveform fits in view
- [ ] Maximum zoom: ~100 samples per pixel (or similar fine detail)
- [ ] Smooth zoom transitions (no visual jumps)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Zoom with trackpad pinch/scroll
**Description:** As a user, I want to zoom using trackpad gestures so the tool works naturally on laptops.

**Acceptance Criteria:**
- [ ] Two-finger pinch zoom works (where supported)
- [ ] Two-finger vertical scroll zooms (ctrlKey + wheel fallback)
- [ ] Same zoom behavior as mouse wheel (centered on cursor)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Horizontal pan when zoomed
**Description:** As a user, I want to pan horizontally when zoomed in so I can navigate the waveform.

**Acceptance Criteria:**
- [ ] Click and drag on waveform pans view horizontally
- [ ] OR horizontal scroll/swipe pans view
- [ ] Cannot pan beyond waveform boundaries
- [ ] Pan position preserved during zoom
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Marker data store
**Description:** As a developer, I need a store to manage marker positions so they persist during the session.

**Acceptance Criteria:**
- [ ] Marker store (React state/context or simple store)
- [ ] Each marker has: id, time position (in seconds)
- [ ] CRUD operations: add, update (move), delete, get all
- [ ] Markers sorted by time position
- [ ] Typecheck passes

---

### US-011: Add marker on click
**Description:** As a user, I want to click on the waveform to add a marker at that position.

**Acceptance Criteria:**
- [ ] Single click on waveform adds marker at click position
- [ ] Marker appears as vertical line spanning waveform height
- [ ] Marker position corresponds to audio time at click location
- [ ] New marker is automatically selected
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-012: Render markers on waveform
**Description:** As a user, I want to see all markers displayed on the waveform so I know where my slices are.

**Acceptance Criteria:**
- [ ] Markers render as thin vertical lines
- [ ] Markers visible at all zoom levels
- [ ] Markers re-render correctly when zooming/panning
- [ ] Marker positions stay accurate relative to audio time
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: Select marker
**Description:** As a user, I want to select a marker so I can move or delete it.

**Acceptance Criteria:**
- [ ] Click near a marker (within ~10px) selects it
- [ ] Selected marker has distinct visual state (different color or thickness)
- [ ] Only one marker selected at a time
- [ ] Clicking empty area deselects current marker
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-014: Move marker by dragging
**Description:** As a user, I want to drag a marker horizontally to reposition it.

**Acceptance Criteria:**
- [ ] Drag selected marker to move it
- [ ] Marker position updates visually during drag (real-time feedback)
- [ ] Marker cannot be dragged outside audio duration (0 to end)
- [ ] Cursor changes to indicate drag mode
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-015: Delete marker with keyboard
**Description:** As a user, I want to delete a selected marker using Delete or Backspace key.

**Acceptance Criteria:**
- [ ] With marker selected, pressing Delete removes it
- [ ] With marker selected, pressing Backspace removes it
- [ ] Selection clears after deletion
- [ ] No action if no marker selected
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-016: Delete marker with context menu
**Description:** As a user, I want to right-click a marker and choose Delete as an alternative deletion method.

**Acceptance Criteria:**
- [ ] Right-click on marker shows context menu with "Delete" option
- [ ] Clicking "Delete" removes the marker
- [ ] Context menu closes after action or click outside
- [ ] Styled consistently with app design (minimal, no native menu)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-017: Visual polish and design system
**Description:** As a user, I want the interface to feel clean and instrument-like so it's pleasant to use.

**Acceptance Criteria:**
- [ ] Neutral background (dark or light theme)
- [ ] High-contrast waveform color
- [ ] Thin, sharp marker lines (1-2px)
- [ ] Monospace or technical font for any text
- [ ] No gradients, shadows, or decorative elements
- [ ] Consistent spacing and alignment
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-018: Load new file replaces current
**Description:** As a user, I want to be able to load a different file, replacing the current one.

**Acceptance Criteria:**
- [ ] Some UI element to load new file (subtle button or drag zone reappears)
- [ ] Loading new file clears previous waveform and all markers
- [ ] Clean state reset (no memory leaks from previous audio)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The system must decode audio files (WAV, MP3, M4A, AAC, FLAC) using the Web Audio API
- FR-2: The system must render the waveform as a Canvas element spanning the full viewport width
- FR-3: The system must support zoom via mouse wheel and trackpad gestures, centered on cursor position
- FR-4: The system must allow adding markers by clicking on the waveform
- FR-5: The system must allow moving markers by dragging them horizontally
- FR-6: The system must allow deleting markers via Delete/Backspace keys or context menu
- FR-7: The system must constrain markers within the audio duration (0 to end)
- FR-8: The system must visually distinguish selected markers from unselected markers
- FR-9: The system must work entirely offline after initial page load
- FR-10: The system must display an error for unsupported or corrupted audio files

## Non-Goals

- Audio playback of any kind
- Keyboard-triggered slice playback
- Export functionality (WAV, MP3, ZIP)
- Auto-slicing or transient detection
- Grid snapping or quantization
- Project save/load
- Multi-file support in UI
- Backend, server, or cloud storage
- User accounts or authentication
- Analytics or tracking
- Mobile-optimized UI (desktop-first)

## Design Considerations

**Visual Direction:**
- Clean, industrial, instrument-like aesthetic
- Neutral background (suggest dark: `#1a1a1a` or light: `#f5f5f5`)
- Waveform: high contrast (e.g., cyan `#00ffff` on dark, or dark blue on light)
- Markers: thin lines (1-2px), distinct color (e.g., red `#ff3333` or orange)
- Selected marker: brighter or thicker variant
- Typography: monospace font (e.g., `JetBrains Mono`, `Fira Code`, or system monospace)
- No gradients, no shadows, no rounded corners on functional elements

**UI Elements (exhaustive list for Phase 1):**
1. Drop zone with file picker button (hidden after load)
2. Waveform canvas (full width)
3. Markers (vertical lines on canvas)
4. Context menu (for marker deletion)
5. Small "load new file" button (appears after file loaded)
6. Error toast/message (for invalid files)

Nothing else.

## Technical Considerations

**Architecture (minimal separation of concerns):**
- `services/AudioService.ts` — Audio decoding and metadata extraction
- `services/WaveformService.ts` — Peak data extraction from AudioBuffer
- `hooks/useMarkers.ts` — Marker state management
- `hooks/useZoom.ts` — Zoom level and pan position state
- `components/DropZone.tsx` — File input UI
- `components/WaveformCanvas.tsx` — Canvas rendering
- `components/Marker.tsx` or inline in canvas — Marker rendering
- `components/ContextMenu.tsx` — Right-click menu

**Performance:**
- Debounce waveform re-render on resize
- Use `requestAnimationFrame` for smooth zoom/pan
- Pre-calculate peaks at multiple zoom levels if needed
- Canvas should handle files up to 10 minutes without lag

**Browser APIs:**
- Web Audio API (`AudioContext`, `decodeAudioData`)
- Canvas 2D API
- File API / Drag and Drop API
- Pointer Events (for cross-device input)

## Success Metrics

- Audio loads and decodes within 2 seconds for a typical 3-minute file
- Waveform renders immediately after decode
- Zoom feels smooth (60fps target)
- Markers can be added in under 1 second from click
- Marker drag feels responsive (no perceptible lag)
- Zero UI elements that don't serve waveform viewing or marker interaction
- A new user can add, move, and delete a marker without instructions

## Open Questions

1. Should horizontal panning use click-drag, scroll gesture, or both?
2. What should the exact hit area for marker selection be (pixels)?
3. Should there be any visual feedback for audio decode progress (loading state)?
4. Dark mode vs light mode — should there be a toggle, or pick one?
5. Maximum file size/duration limit to prevent browser memory issues?
