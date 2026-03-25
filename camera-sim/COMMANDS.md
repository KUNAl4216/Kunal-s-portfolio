# Camera Simulation Engine — Complete Commands Log

> Every command executed to build this project from an empty directory, in exact order.

---

## Phase 1: Environment Setup

### 1.1 Install Node Version Manager (nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

**What it does:** Downloads and installs nvm, which manages multiple Node.js versions. Adds nvm initialization to `~/.bashrc`.

### 1.2 Load nvm into current shell

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

**What it does:** Sources the nvm script so `nvm` commands work in the current terminal session without reopening it.

### 1.3 Install Node.js (Latest LTS)

```bash
nvm install --lts
```

**What it does:** Downloads and installs the latest Long Term Support version of Node.js (v24.14.0) along with npm (v11.9.0).

**Output:**
```
Downloading and installing node v24.14.0...
Now using node v24.14.0 (npm v11.9.0)
Creating default alias: default -> lts/*
```

---

## Phase 2: Project Scaffolding

### 2.1 Create Vite + React + TypeScript project

```bash
npm create vite@latest camera-sim -- --template react-ts
```

**What it does:** Uses Vite's project scaffolding tool to create a new React project with TypeScript template. Creates the `camera-sim/` directory with all boilerplate files.

**Output:**
```
Scaffolding project in /home/kunal/3D_project/camera-sim...
Done.
```

### 2.2 Install base dependencies

```bash
cd /home/kunal/3D_project/camera-sim
npm install
```

**What it does:** Reads `package.json` and installs all base dependencies (React, ReactDOM, TypeScript, Vite, ESLint, etc.) into `node_modules/`.

**Output:**
```
added 173 packages, and audited 174 packages in 15s
found 0 vulnerabilities
```

### 2.3 Install additional dependencies

```bash
npm install lucide-react react-router-dom @types/react-router-dom tailwindcss @tailwindcss/vite --legacy-peer-deps
```

**What it does:** Installs:
- `lucide-react` — Icon library (Camera, Cpu, Wifi, Code, etc.)
- `react-router-dom` — Client-side routing
- `@types/react-router-dom` — TypeScript types for router
- `tailwindcss` — Utility-first CSS framework
- `@tailwindcss/vite` — Tailwind CSS Vite plugin

The `--legacy-peer-deps` flag is needed because `@tailwindcss/vite` has a peer dependency conflict with Vite 8.

**Output:**
```
added 28 packages, and audited 202 packages in 4s
found 0 vulnerabilities
```

---

## Phase 3: Directory Structure Creation

### 3.1 Create all source directories

```bash
mkdir -p src/{components/{layout,camera,pipeline,preview,detection,embedded,network,developer},hooks,utils,types,contexts,assets}
```

**What it does:** Creates the entire component directory tree in one command:

```
src/
├── components/
│   ├── layout/       — Header, Sidebar
│   ├── camera/       — Camera sensor controls
│   ├── pipeline/     — Pipeline config & visualization
│   ├── preview/      — Camera viewport & preview modes
│   ├── detection/    — Motion/object detection
│   ├── embedded/     — Board simulation, GPIO
│   ├── network/      — Streaming & network sim
│   └── developer/    — Code editor & mock execution
├── hooks/            — Custom React hooks
├── utils/            — Image processing utilities
├── types/            — TypeScript type definitions
├── contexts/         — React Context providers
└── assets/           — Static assets
```

---

## Phase 4: Configuration

### 4.1 Update Vite config (add Tailwind plugin)

**File modified:** `vite.config.ts`

```typescript
// Before:
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
})

// After:
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

## Phase 5: Source File Creation

### 5.1 Files created (in order)

Every file below was created from scratch using the Write tool:

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `src/index.css` | 91 | Global styles, CSS variables, dark theme, scrollbar, inputs |
| 2 | `src/types/camera.ts` | 112 | All TypeScript interfaces (CameraConfig, LensConfig, ISPConfig, etc.) |
| 3 | `src/contexts/CameraContext.tsx` | 182 | Global state with React Context + useState for all camera/pipeline/board state |
| 4 | `src/utils/imageProcessing.ts` | 300 | Pixel-level processing: lens, sensor, ISP, encoder effects + motion detection |
| 5 | `src/hooks/useWebcam.ts` | 44 | getUserMedia wrapper for live webcam access |
| 6 | `src/hooks/useSyntheticVideo.ts` | 739 | Procedural scene generator (buildings, cars, people, weather, day/night) |
| 7 | `src/components/layout/Sidebar.tsx` | 111 | Collapsible sidebar with 8-tab navigation |
| 8 | `src/components/layout/Header.tsx` | 102 | Top header bar with stream/record/fullscreen controls |
| 9 | `src/components/common/SliderControl.tsx` | 35 | Reusable range slider component |
| 10 | `src/components/common/SectionHeader.tsx` | 25 | Reusable section header with icon |
| 11 | `src/components/common/ToggleSwitch.tsx` | 31 | Reusable on/off toggle switch |
| 12 | `src/components/camera/CameraPanel.tsx` | 405 | Camera sensor controls, presets, histogram, sensor specs |
| 13 | `src/components/pipeline/PipelinePanel.tsx` | 141 | Lens, ISP, Encoder configuration UI |
| 14 | `src/components/preview/PreviewPanel.tsx` | 75 | Raw/Processed/Encoded mode selection |
| 15 | `src/components/detection/DetectionPanel.tsx` | 395 | Motion detection, heatmap, zones, triggers |
| 16 | `src/components/embedded/EmbeddedPanel.tsx` | 596 | Board selection, GPIO, wiring diagram, serial console |
| 17 | `src/components/network/NetworkPanel.tsx` | 158 | RTSP/WebRTC/HTTP config, latency/packet loss sim |
| 18 | `src/components/developer/DeveloperPanel.tsx` | 731 | Code editor, 6 templates, syntax highlighting, mock execution |
| 19 | `src/components/events/EventsPanel.tsx` | 109 | Event log viewer with export |
| 20 | `src/components/preview/CameraViewport.tsx` | 492 | Main canvas, motion overlay, grid, crosshair, snapshot, zoom |
| 21 | `src/components/pipeline/PipelineFlow.tsx` | 225 | Animated pipeline bar with data flow dots |
| 22 | `src/App.tsx` | 70 | Root component — layout with sidebar, viewport, panels |
| 23 | `src/main.tsx` | 10 | React DOM entry point |

### 5.2 Files removed

```bash
rm -f /home/kunal/3D_project/camera-sim/src/App.css
```

**What it does:** Removes the default Vite boilerplate CSS file (replaced by `index.css` with custom theme).

---

## Phase 6: Build Verification

### 6.1 TypeScript type-check (no emit)

```bash
cd /home/kunal/3D_project/camera-sim
npx tsc --noEmit
```

**What it does:** Runs the TypeScript compiler across all source files to check for type errors without generating output files.

**Output:** (empty — zero errors)

### 6.2 Start development server

```bash
npm run dev
```

**What it does:** Starts Vite's hot-reloading development server.

**Output:**
```
VITE v8.0.0  ready in 376 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6.3 Verify server is serving

```bash
curl -s http://localhost:5173/ | head -20
```

**What it does:** Fetches the dev server's HTML response to confirm it's running and serving the React app.

---

## Phase 7: Feature Upgrades (V2)

After the initial build was verified, all features were upgraded by rewriting the following files:

| # | File Rewritten | What Changed |
|---|---------------|-------------|
| 1 | `src/hooks/useSyntheticVideo.ts` | Added moon, stars, clouds, weather (rain/fog), streetlights, traffic light, 4 people, 3 cars, dog, birds, trees, hills, day/dusk/night cycling, security camera overlay |
| 2 | `src/components/pipeline/PipelineFlow.tsx` | Added animated data flow dots, processing indicator bars, per-stage metrics, throughput counter |
| 3 | `src/components/camera/CameraPanel.tsx` | Added 6 quick presets, live RGB histogram, sensor info card, grouped controls, sensor specs table, reset button |
| 4 | `src/components/detection/DetectionPanel.tsx` | Added live motion heatmap canvas, detection zones, motion statistics, buzzer trigger, auto-record trigger |
| 5 | `src/components/embedded/EmbeddedPanel.tsx` | Added detailed board specs, live fluctuating system monitor, canvas wiring diagram, interactive serial console |
| 6 | `src/components/developer/DeveloperPanel.tsx` | Added 6 templates (was 4), syntax highlighting, VS Code-style editor, ISP pipeline + Python OpenCV templates |
| 7 | `src/components/preview/CameraViewport.tsx` | Added snapshot with flash, zoom controls, grid overlay, crosshair, frame time display, LIVE/REC badges |

### 7.1 Final type-check after upgrades

```bash
npx tsc --noEmit
```

**Output:** (empty — zero errors)

---

## Complete Command Summary (Copy-Paste Ready)

```bash
# ========================================
# ENVIRONMENT SETUP
# ========================================

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js LTS
nvm install --lts

# ========================================
# PROJECT CREATION
# ========================================

# Create Vite React TypeScript project
cd /home/kunal/3D_project
npm create vite@latest camera-sim -- --template react-ts

# Install dependencies
cd camera-sim
npm install
npm install lucide-react react-router-dom @types/react-router-dom tailwindcss @tailwindcss/vite --legacy-peer-deps

# ========================================
# DIRECTORY STRUCTURE
# ========================================

mkdir -p src/{components/{layout,camera,pipeline,preview,detection,embedded,network,developer},hooks,utils,types,contexts,assets}

# ========================================
# CLEANUP
# ========================================

rm -f src/App.css

# ========================================
# BUILD & RUN
# ========================================

# Type-check
npx tsc --noEmit

# Start dev server
npm run dev

# Verify (in another terminal)
curl -s http://localhost:5173/ | head -5
```

---

## Production Build (when ready)

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Output will be in dist/ directory
```

---

## Troubleshooting Commands

```bash
# If nvm not found after install
source ~/.bashrc

# If port 5173 is already in use
npx kill-port 5173
npm run dev

# If node_modules are corrupted
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# If TypeScript errors appear
npx tsc --noEmit 2>&1 | head -50

# Check installed package versions
npm list --depth=0

# Check Node.js version
node --version    # Expected: v24.14.0
npm --version     # Expected: v11.9.0
```

---

## File Count Summary

| Category | Count |
|----------|-------|
| Commands executed (shell) | 12 |
| Files created from scratch | 23 |
| Files modified (config) | 2 |
| Files deleted (boilerplate) | 1 |
| Files rewritten (v2 upgrades) | 7 |
| **Total operations** | **45** |
