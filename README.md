# 🎵 Sample Slice Tool

A browser-based audio sample slicer for quickly chopping audio files into sections. Built with React, TypeScript, and the Web Audio API.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### 🎚️ Waveform Editor
- **High-resolution waveform** - Canvas-based rendering with HiDPI support
- **Zoom & Pan** - Mouse wheel zoom, trackpad pinch, drag to pan
- **Click to add markers** - Create section boundaries instantly
- **Drag markers** - Reposition with real-time visual feedback
- **Marker preview** - See where new markers will be placed on hover

### 🎹 Keyboard Playback
- **Number keys 1-9** - Instantly play sections
- **Visual feedback** - Keyboard badge blinks on keypress
- **Section-based mapping** - Only enabled sections get keyboard shortcuts

### 📁 Section Management
- **Custom names** - Double-click to rename sections
- **Enable/Disable** - Toggle sections on/off
- **Drag handles** - Visual affordance for marker dragging

### 💾 Export
- **WAV export** - Lossless audio export
- **MP3 export** - Compressed audio (192kbps)
- **Per-section export** - Export individual sections

### ↩️ Undo/Redo
- **Full history** - Undo/redo for all marker operations
- **Keyboard shortcuts** - Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z
- **Atomic operations** - Marker drags are single undo steps
- **Reset** - Clear all with confirmation dialog

### 🎨 Design
- **Dark theme** - Easy on the eyes for long sessions
- **Minimal UI** - Clean, instrument-like interface
- **Responsive** - Works on different screen sizes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/sample-slice-tool.git
cd sample-slice-tool

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## 🎧 Supported Audio Formats

| Format | Extension |
|--------|-----------|
| WAV    | .wav      |
| MP3    | .mp3      |
| AAC    | .m4a, .aac|
| FLAC   | .flac     |

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-9` | Play section 1-9 |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Space` | Play/Pause (when section selected) |

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Web Audio API** - Audio processing
- **Canvas API** - Waveform rendering

## 📄 License

MIT License - feel free to use this in your own projects!

## 🙏 Acknowledgments

Built with [Claude Code](https://claude.ai/claude-code) using the Ralph autonomous agent system.
