# PRD: Toolbar Spacing & Load File Icon

## Introduction

Minor UI refinements to improve visual spacing and consistency. Add bottom margin to the editor toolbar and add an icon to the Load file button to match the iconography style used throughout the app.

## Goals

- Improve visual separation between toolbar and waveform area
- Add icon to Load file button for consistency with other buttons
- Maintain Teenage Engineering–inspired minimal aesthetic

## User Stories

### US-001: Add bottom spacing to EditorToolbar
**Description:** As a user, I want more visual separation between the toolbar and waveform so the layout feels less cramped.

**Acceptance Criteria:**
- [ ] Add `mb-4` (16px) bottom margin to EditorToolbar container
- [ ] Spacing applies whether controls are visible or hidden
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Add Upload icon to Load file button
**Description:** As a user, I want the Load file button to have an icon so it matches the visual style of other buttons.

**Acceptance Criteria:**
- [ ] Import `Upload` icon from lucide-react
- [ ] Add Upload icon (w-4 h-4) to FileLoaderButton
- [ ] Icon positioned left of text with appropriate gap
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: EditorToolbar has 16px bottom margin (`mb-4`)
- FR-2: FileLoaderButton displays Upload icon from Lucide React
- FR-3: Icon uses `w-4 h-4` sizing consistent with other toolbar icons

## Non-Goals

- No changes to toolbar functionality
- No changes to button behavior
- No other spacing adjustments

## Technical Considerations

- EditorToolbar is in `src/components/EditorToolbar.tsx`
- FileLoaderButton is in `src/components/FileLoaderButton.tsx`
- Use Lucide React `Upload` icon (not Unicode)

## Success Metrics

- Visual consistency with existing icon buttons
- Improved spacing creates clearer visual hierarchy
