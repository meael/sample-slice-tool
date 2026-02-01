# CLAUDE.md - Codebase Patterns

## Project Overview
Audio sample slicing tool built with React 18 + TypeScript + Vite + Tailwind CSS.

## Architecture

### Services (Singletons)
- `src/services/AudioService.ts` - Web Audio API decoding (WAV, MP3, M4A, AAC, FLAC)
- `src/services/WaveformService.ts` - AudioBuffer to peaks array conversion
- `src/services/ExportService.ts` - Section export to WAV/MP3

### Hooks
- `useMarkers` - Marker CRUD with undo/redo support
- `useZoom` - Zoom/pan state with cursor-centered zoom
- `useKeyboardControls` - Number keys 1-9 trigger section playback
- `useUndoRedo` - Generic undo/redo state wrapper

### Key Components
- `WaveformCanvas.tsx` - Canvas-based waveform with markers, zoom, pan, drag
- `MarkerControlStrip.tsx` - Controls above markers (keyboard labels, delete)
- `SectionHeader.tsx` - Section name, enable/disable, export dropdown

## Patterns

### State vs Refs
- Use **state** for values that need re-renders (visual updates)
- Use **refs** for values that change during mouse events (no re-render needed)
- Example: `draggingMarkerId` (state) vs `draggingMarkerIdRef` (ref)

### Canvas Rendering
- Use `devicePixelRatio` for crisp high-DPI rendering
- Marker hit detection: `MARKER_HIT_THRESHOLD = 16px`
- Colors: cyan-400 accent, orange markers, amber selected

### Z-Index Layering
```
z-10: Waveform canvas
z-20: MarkerControlStrip
z-40: Dropdown menus
z-50: Popovers/modals
```

### Undo/Redo
- `setStateWithoutHistory` for intermediate updates (drag)
- `setState` for committed changes (drag end)
- Marker drag is atomic (single undo reverts entire drag)

## Styling
- Dark theme: `bg-neutral-900`, borders `neutral-600/700`
- Accent: `cyan-400`
- No shadows or gradients - flat, instrument-like UI
- Tailwind utility classes only

## Audio
- Supported: WAV, MP3, M4A, AAC, FLAC
- Formats defined in `src/types/audio.ts`
- Sections derived from consecutive markers via `getSections()`
