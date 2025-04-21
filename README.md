## MuseBoard User Manual

Welcome to MuseBoard, your digital whiteboard for brainstorming, note-taking, and visual collaboration. This manual will guide you through installing, launching, and using MuseBoard effectively.

---

### Table of Contents
- [MuseBoard User Manual](#museboard-user-manual)
  - [Table of Contents](#table-of-contents)
- [About MuseBoard](#about-museboard)
- [Installation](#installation)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [For End Users](#for-end-users)
  - [For Developers](#for-developers)
    - [Prerequisites](#prerequisites)
    - [Development Setup](#development-setup)
- [Launching MuseBoard](#launching-museboard)
- [Workspace Overview](#workspace-overview)
  - [Panel \& Pop-out Toggle](#panel--pop-out-toggle)
  - [Canvas Area](#canvas-area)
  - [Toolbar](#toolbar)
  - [Settings Menu](#settings-menu)
- [Toolbar Functions](#toolbar-functions)
  - [Add Text](#add-text)
  - [Add Media (Image/GIF)](#add-media-imagegif)
  - [Add Link](#add-link)
  - [Draw Mode](#draw-mode)
    - [Selecting a Tool](#selecting-a-tool)
    - [Color \& Thickness](#color--thickness)
    - [Drawing Tools Explained](#drawing-tools-explained)
  - [Clear (Erase) Mode](#clear-erase-mode)
  - [Undo Action](#undo-action)
- [Saving \& Loading Boards](#saving--loading-boards)
- [Settings \& Customization](#settings--customization)
  - [Launch on Startup](#launch-on-startup)
  - [Dark Mode](#dark-mode)
  - [Customize Theme](#customize-theme)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips \& Best Practices](#tips--best-practices)
- [Troubleshooting \& FAQs](#troubleshooting--faqs)
- [Screenshots](#screenshots)

---

## About MuseBoard
MuseBoard is an Electron-based digital whiteboard designed to combine flexibility and ease of use. Whether you're sketching ideas, annotating visuals, or drafting quick notes, MuseBoard keeps your creativity flowing.

## Installation
1. Visit the [Releases page](https://github.com/yourrepo/MuseBoard/releases) on GitHub.
2. **Download the Windows installer** (`.exe`). This is the only installer available at the moment.
3. Run the downloaded `.exe` and follow the on-screen prompts.
4. **macOS installer coming soon!** We’re actively working on a `.dmg` package for Mac users.

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Framework**: Electron.js

## Getting Started

### For End Users
1. Download the latest version of MuseBoard from the [Releases](https://github.com/randomusername01/MuseboardCapstone/releases) section on GitHub.
2. Run the `.exe` installer and follow the on-screen instructions to install MuseBoard.
3. Launch the application from your desktop or start menu.

### For Developers
#### Prerequisites
- [Node.js](https://nodejs.org/) installed on your system.

#### Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/randomusername01/MuseboardCapstone.git
   ```
2. Navigate to the project directory:
   ```bash
   cd MuseboardCapstone
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm start
   ```

## Launching MuseBoard
By default, MuseBoard runs as a hidden sidebar. Click the arrow icon on the side of your screen to pop it out. Click again to hide it.

## Workspace Overview

### Panel & Pop-out Toggle
- **Toggle Button**: The side-arrow icon opens and closes the MuseBoard panel.

### Canvas Area
- **Workspace**: The main whiteboard where you place and edit content.

### Toolbar
Located at the top of the panel, provides quick access to all creation tools.

### Settings Menu
Click the gear icon to access options like **Open**, **Save**, **Launch on Start**, **Dark Mode**, and **Customize Theme**.

## Toolbar Functions

### Add Text
1. Click the **Text** icon.
2. A text box appears; type your content directly.
3. Drag to reposition.

### Add Media (Image/GIF)
1. Click the **Media** icon.
2. Choose an image or GIF file from your computer.
3. Drag to reposition and resize.

### Add Link
1. Click the **Link** icon.
2. Enter the URL and optional display text.
3. The link appears on the canvas and opens in your browser when clicked.

### Draw Mode
Click the **Draw** icon to enter freehand drawing mode. Double-click to open drawing options.

#### Selecting a Tool
- **Pen**: Standard line.
- **Pencil**: Subtle, semi-transparent strokes.
- **Highlighter**: Broad, semi-transparent lines for emphasizing.
- **Brush**: Soft, shadowed strokes.

#### Color & Thickness
- **Color Picker**: Choose any hex color.
- **Thickness Slider**: Adjust line width from 1–10px.

#### Drawing Tools Explained
- **Pen**: Good for precise annotations.
- **Pencil**: Sketchy look, 80% opacity.
- **Highlighter**: 50% opacity, extra thick.
- **Brush**: Artistic style with shadow blur.

### Clear (Erase) Mode
Click the **Clear** icon to toggle erase mode. Click elements or strokes to remove them.

### Undo Action
Click the **Undo** icon to revert the last action (drawing or element placement).

## Saving & Loading Boards
- **Save**: In the settings menu, choose **Save**, then pick a filename (`.board`).
- **Open**: In the settings menu, choose **Open**, then select a `.board` file to restore your workspace.

## Settings & Customization

### Launch on Startup
Toggle on to have MuseBoard automatically start when you log in.

### Dark Mode
Toggle on for a darker UI to reduce eye strain.

### Customize Theme
Open the **Customize Theme** panel to adjust default tool colors and thicknesses for each drawing tool.

## Keyboard Shortcuts
- `Esc`: Close modals (link or tutorial).
- `Ctrl+Z` / `Cmd+Z`: Undo last action.
- `D`: Toggle draw mode.
- `E`: Toggle erase mode.

## Tips & Best Practices
- Use layers of text and media to keep content organized.
- Double-click the Draw icon to quickly switch pen settings without leaving draw mode.
- Reset tools to defaults with the **Reset Tools** button in drawing options.

## Troubleshooting & FAQs

**Q: Why won’t my drawing color change?**  
A: Open draw options (double-click Draw), adjust the color picker, and ensure you’re not in erase mode.

**Q: Strokes aren’t responsive on resize.**  
A: Use **Reinit Canvas** (in Developer menu) after a major layout change.

**Q: Can’t find my saved board.**  
A: Check the default save directory or use **File > Open** in the settings menu.

## Screenshots
![Closed](https://github.com/Cjking57893/Museboard/blob/main/assets/MuseBoard%20Screenshots/Closed.png)
![Opened](https://github.com/Cjking57893/Museboard/blob/main/assets/MuseBoard%20Screenshots/Opened.png)
![In-Use](https://github.com/Cjking57893/Museboard/blob/main/assets/MuseBoard%20Screenshots/In-Use.png)

---

_For further help or to report bugs, visit our [GitHub Issues page](https://github.com/yourrepo/MuseBoard/issues)._

---
