# PRD: Section Naming and Export

## Introduction

Extend the existing audio section functionality to support user-defined names and audio export capabilities. Users can name each section for clarity, export individual sections as WAV or MP3 files, and bulk export all sections as a ZIP archive. This enables extracting meaningful audio segments for external use without complex asset management.

## Goals

- Allow users to assign and edit names for each audio section
- Display section names clearly above the waveform, aligned with section boundaries
- Enable exporting individual sections with format selection (WAV/MP3)
- Support bulk export of all sections as a ZIP archive
- Show progress indication during export operations
- Keep UI clear and consistent with existing waveform interactions

## User Stories

### US-001: Add name field to section/marker data model
**Description:** As a developer, I need sections to have a name property so names can be stored and displayed.

**Acceptance Criteria:**
- [ ] Add `name` field (string) to marker/section type definition
- [ ] Default name generated when marker created: "Section 1", "Section 2", etc.
- [ ] Name persists in marker state during session
- [ ] useMarkers hook updated to handle name field
- [ ] Typecheck passes

---

### US-002: Display section names in control strip
**Description:** As a user, I want to see section names displayed above the waveform so I can identify each section.

**Acceptance Criteria:**
- [ ] Section name displayed in MarkerControlStrip for each marker
- [ ] Name positioned aligned with marker/section start position
- [ ] Font readable (12-14px), neutral color for visibility
- [ ] Long names truncated with ellipsis (max ~100px width)
- [ ] Names don't overlap with number badges or close icons
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Inline editing of section names
**Description:** As a user, I want to click on a section name to edit it inline so I can quickly rename sections.

**Acceptance Criteria:**
- [ ] Clicking section name activates edit mode (input field replaces text)
- [ ] Input pre-filled with current name, text selected for easy replacement
- [ ] Enter key or blur saves the new name
- [ ] Escape key cancels edit and reverts to original name
- [ ] Empty name reverts to default ("Section N")
- [ ] Name updates in marker state via useMarkers
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Add export button to each section
**Description:** As a user, I want an export button on each section so I can export individual segments.

**Acceptance Criteria:**
- [ ] Export button (download icon) displayed in control strip for each marker
- [ ] Button positioned near section name/close icon
- [ ] Button has hover feedback (pointer cursor, opacity change)
- [ ] Clicking button opens format selection dropdown (WAV, MP3)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Create audio export service
**Description:** As a developer, I need a service to encode and export audio segments in WAV and MP3 formats.

**Acceptance Criteria:**
- [ ] Create useExport hook or ExportService in src/services or src/hooks
- [ ] exportSection(audioBuffer, startTime, endTime, format, filename) function
- [ ] Supports WAV format encoding (PCM)
- [ ] Supports MP3 format encoding (use lamejs or similar library)
- [ ] Returns Blob or triggers download
- [ ] Handles edge cases: very short sections, start >= end
- [ ] Typecheck passes

---

### US-006: Export individual section as WAV
**Description:** As a user, I want to export a section as a WAV file so I can use it in other applications.

**Acceptance Criteria:**
- [ ] Selecting WAV from export dropdown triggers WAV export
- [ ] Exported file contains exact audio from section start to end
- [ ] File named: "{section-name}.wav" (sanitized for filesystem)
- [ ] Download initiates via browser download API
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Export individual section as MP3
**Description:** As a user, I want to export a section as an MP3 file for smaller file sizes.

**Acceptance Criteria:**
- [ ] Selecting MP3 from export dropdown triggers MP3 export
- [ ] Exported file contains exact audio from section start to end
- [ ] MP3 encoded at reasonable quality (128-192 kbps)
- [ ] File named: "{section-name}.mp3" (sanitized for filesystem)
- [ ] Download initiates via browser download API
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Add "Export All" button to header
**Description:** As a user, I want a button to export all sections at once so I can quickly get all my segments.

**Acceptance Criteria:**
- [ ] "Export All" button visible in header area when audio loaded and markers exist
- [ ] Button hidden or disabled when no markers present
- [ ] Button styled consistently with app design
- [ ] Clicking button opens format selection dropdown (WAV, MP3)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Bulk export all sections as ZIP
**Description:** As a user, I want to export all sections as separate files in a ZIP archive.

**Acceptance Criteria:**
- [ ] Selecting format from "Export All" triggers bulk export
- [ ] Each section exported as individual file in selected format
- [ ] Files named: "{section-name}.{ext}" for each section
- [ ] Files ordered chronologically by section position in archive
- [ ] ZIP archive named: "{original-filename}-sections.zip" or similar
- [ ] Uses JSZip or similar library for ZIP creation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Show export progress indicator
**Description:** As a user, I want to see progress during export operations so I know the export is working.

**Acceptance Criteria:**
- [ ] Progress indicator (spinner or progress bar) shown during export
- [ ] For individual export: simple spinner near export button or toast
- [ ] For bulk export: progress bar showing percentage or "Exporting X of Y"
- [ ] UI remains interactive during export (non-blocking)
- [ ] Progress clears when export completes
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Show export completion feedback
**Description:** As a user, I want feedback when export completes so I know it succeeded.

**Acceptance Criteria:**
- [ ] Toast notification or visual feedback on export success
- [ ] Message indicates what was exported (e.g., "Exported Section 1.wav")
- [ ] For bulk export: "Exported N sections to ZIP"
- [ ] Error state shown if export fails
- [ ] Toast auto-dismisses after 3-5 seconds
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Add `name` field to marker data type with auto-generated default ("Section N")
- FR-2: Display section names in control strip aligned with marker positions
- FR-3: Support inline editing of section names via click-to-edit
- FR-4: Add export button with format dropdown (WAV/MP3) for each section
- FR-5: Implement WAV encoding using Web Audio API or AudioBuffer conversion
- FR-6: Implement MP3 encoding using lamejs or similar client-side library
- FR-7: Export individual sections with filename derived from section name
- FR-8: Add "Export All" button in header area (visible when markers exist)
- FR-9: Bulk export creates ZIP archive with all sections as separate files
- FR-10: Show progress indicator during export operations
- FR-11: Show completion toast on export success/failure
- FR-12: Sanitize filenames (remove invalid characters, handle empty names)
- FR-13: Files in ZIP ordered chronologically by section position

## Non-Goals

- Editing audio content beyond trimming by section boundaries
- Applying audio effects (normalization, compression, etc.) during export
- Supporting formats other than WAV and MP3
- Managing export history or versioning
- Cloud storage or upload functionality
- Batch format conversion (export same section in multiple formats at once)

## Design Considerations

**Control Strip Layout:**
- Section name: left-aligned, truncated with ellipsis if > 100px
- Number badge: next to name (existing)
- Export button: small download icon, after badge
- Close icon: rightmost (existing)

**Export Button:**
- Small download icon (↓ or similar)
- Dropdown appears below on click with "WAV" and "MP3" options
- Dropdown styled consistently with app (dark background, light text)

**Export All Button:**
- Located in header near "Load file" button
- Text: "Export All" with download icon
- Same dropdown pattern for format selection

**Progress Indicator:**
- Individual: small spinner replacing export icon temporarily
- Bulk: modal or overlay with progress bar and "Exporting 3 of 8..."

**Toast Notifications:**
- Bottom-right corner, dark background
- Auto-dismiss after 4 seconds
- Shows filename or count exported

## Technical Considerations

**Audio Encoding:**
- WAV: Convert AudioBuffer to PCM data, create WAV header, output Blob
- MP3: Use lamejs library for client-side MP3 encoding
- Both operations should run in Web Worker if possible to avoid UI blocking

**ZIP Creation:**
- Use JSZip library (lightweight, browser-compatible)
- Generate files in memory, then create ZIP blob
- For large exports, consider streaming or chunked processing

**Filename Sanitization:**
- Remove: / \ : * ? " < > |
- Replace spaces with underscores or hyphens
- Fallback to "section-N" if name empty after sanitization

**Dependencies to add:**
- `lamejs` — MP3 encoding
- `jszip` — ZIP archive creation
- `file-saver` — Cross-browser file download (optional, can use native)

**Performance:**
- Use async/await for encoding operations
- Show progress updates via callbacks or events
- Consider Web Workers for encoding if performance is an issue

## Success Metrics

- Users can name a section in under 3 seconds
- Individual export completes in under 2 seconds for typical sections
- Bulk export of 10 sections completes in under 10 seconds
- Exported audio matches section boundaries exactly (no drift)
- No UI freezing during export operations

## Open Questions

1. Should the format dropdown remember last selection?
2. Should there be a "Cancel" option during bulk export?
3. What MP3 bitrate should be used (128, 192, 256 kbps)?
4. Should export be disabled during playback or work independently?
