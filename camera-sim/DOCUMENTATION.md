# Camera Simulation Engine — Technical Documentation

> **Version:** 1.0
> **Platform:** Web-based (React + TypeScript + Vite)
> **Total Source Code:** ~5,200 lines across 24 files
> **Purpose:** Simulate real embedded camera systems (IP cameras, Raspberry Pi, smart surveillance) entirely in the browser — no physical hardware required.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Camera Hardware Simulation](#3-camera-hardware-simulation)
4. [Camera Pipeline (Core Engine)](#4-camera-pipeline-core-engine)
5. [Real-Time Preview System](#5-real-time-preview-system)
6. [Event & Detection System](#6-event--detection-system)
7. [Embedded System Integration](#7-embedded-system-integration)
8. [Networking Simulation](#8-networking-simulation)
9. [Developer Mode](#9-developer-mode)
10. [Synthetic Scene Engine](#10-synthetic-scene-engine)
11. [UI/UX Architecture](#11-uiux-architecture)
12. [File Structure & Code Map](#12-file-structure--code-map)
13. [Technology Stack](#13-technology-stack)
14. [How It Works — End to End](#14-how-it-works--end-to-end)

---

## 1. Project Overview

### What Is This?

The Camera Simulation Engine is a **web-based hardware simulator** that mimics how embedded Linux camera systems and IP cameras actually work. It simulates the full imaging pipeline — from photon hitting the sensor to encoded video streaming over a network.

### Who Is It For?

- **Embedded developers** designing camera-based systems without physical hardware
- **IoT engineers** prototyping surveillance / smart camera systems
- **Students** learning how camera pipelines, ISPs, and video encoding work
- **Product teams** testing camera configurations before hardware arrives

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Sensor Simulation** | CMOS sensor with configurable resolution, FPS, exposure, gain, ISO, day/night mode, IR |
| **Full ISP Pipeline** | Scene → Lens → Sensor → ISP → Encoder → Stream — each stage is modular and configurable |
| **Real-Time Processing** | Canvas-based pixel-level image processing at up to 60fps |
| **Motion Detection** | Frame-differencing algorithm with configurable sensitivity, heatmap visualization, auto-triggers |
| **Embedded Board Sim** | Raspberry Pi 4B / ESP32-CAM / Custom board with GPIO pins, system monitor, serial console |
| **Network Simulation** | RTSP / WebRTC / HTTP protocol simulation with latency, jitter, packet loss controls |
| **Developer Mode** | C/C++/Python code templates with mock compilation and execution |
| **Dual Input Sources** | Live webcam (WebRTC) or procedurally-generated synthetic surveillance scene |

---

## 2. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Application                      │
├──────────┬──────────────────────────────────┬───────────────┤
│ Sidebar  │        Camera Viewport           │  Right Panel  │
│ (Nav)    │  ┌─────────────────────────┐     │  (Controls)   │
│          │  │  Source Canvas           │     │               │
│ Camera   │  │  (Webcam / Synthetic)    │     │  Camera       │
│ Pipeline │  └──────────┬──────────────┘     │  Pipeline     │
│ Preview  │             │                     │  Preview      │
│ Detection│  ┌──────────▼──────────────┐     │  Detection    │
│ Embedded │  │  Processing Pipeline     │     │  Embedded     │
│ Network  │  │  Lens → Sensor → ISP →   │     │  Network      │
│ Developer│  │  Encoder                 │     │  Developer    │
│ Events   │  └──────────┬──────────────┘     │  Events       │
│          │             │                     │               │
│          │  ┌──────────▼──────────────┐     │               │
│          │  │  Output Canvas           │     │               │
│          │  │  + Motion Overlay         │     │               │
│          │  │  + Grid / Crosshair      │     │               │
│          │  └─────────────────────────┘     │               │
├──────────┴──────────────────────────────────┴───────────────┤
│                    Pipeline Flow Bar                         │
│  [Scene] → [Lens] → [Sensor] → [ISP] → [Encoder] → [Stream]│
└─────────────────────────────────────────────────────────────┘
```

### State Management

All camera state is centralized in `CameraContext` using React Context + `useState`:

```
CameraContext
├── camera: CameraConfig      (sensor settings)
├── lens: LensConfig           (optical parameters)
├── isp: ISPConfig             (image signal processor)
├── encoder: EncoderConfig     (video compression)
├── stream: StreamConfig       (network streaming)
├── detection: DetectionConfig (motion/object detection)
├── board: EmbeddedBoard       (GPIO, CPU, memory, temp)
├── previewMode: PreviewMode   (raw / processed / encoded)
├── events: EventLog[]         (timestamped event log)
├── isStreaming: boolean
├── isRecording: boolean
├── motionDetected: boolean
└── frameCount: ref<number>
```

### Data Flow

```
Input Source (Webcam/Synthetic)
    │
    ▼
┌─ Canvas Frame ─────────────────────────────┐
│                                             │
│  1. applyLensEffects()     [Blur, Distortion, Focus]
│       │                                     │
│  2. applySensorEffects()   [Exposure, Gain, ISO, Noise, Night/IR]
│       │                                     │
│  3. applyISPEffects()      [White Balance, Gamma, Color Mode, Denoise]
│       │                                     │
│  4. applyEncoderEffects()  [Compression Artifacts, Macroblocking]
│       │                                     │
│  5. detectMotion()         [Frame Diff → Heatmap → Events → GPIO]
│                                             │
└─────────────────────────────────────────────┘
    │
    ▼
Output Canvas (displayed to user)
```

---

## 3. Camera Hardware Simulation

**File:** `src/components/camera/CameraPanel.tsx` (405 lines)
**Types:** `src/types/camera.ts` — `CameraConfig` interface

### Configurable Parameters

| Parameter | Range | Effect |
|-----------|-------|--------|
| **Sensor Type** | CMOS (fixed) | Displays sensor metadata |
| **Resolution** | 720p / 1080p / 4MP / 5MP | Changes output dimensions label |
| **Frame Rate** | 15 / 30 / 60 fps | Controls render loop interval |
| **Exposure** | 0–100 | Multiplies pixel brightness (simulates shutter time) |
| **Gain** | 0–100 | Amplifies signal (introduces noise at high values) |
| **ISO** | 100–6400 | Controls noise grain amount |
| **Brightness** | -50 to +50 | Additive brightness offset |
| **Contrast** | -50 to +50 | Stretches/compresses tonal range |
| **Saturation** | -50 to +50 | Color intensity (0 = grayscale) |
| **Sharpness** | 0–100 | Edge enhancement intensity |
| **Noise Reduction** | 0–100 | Counteracts ISO noise |
| **Day/Night Mode** | Day / Night / Auto | Switches color profile |
| **IR LED** | On/Off | Enables infrared night vision (green-tinted grayscale) |

### Quick Presets

| Preset | Key Settings |
|--------|-------------|
| **Daylight** | Low ISO (200), moderate exposure, saturation boost |
| **Low Light** | High ISO (3200), high gain, heavy noise reduction |
| **IR Night** | Night mode + IR enabled, desaturated, high exposure |
| **High Motion** | 60fps, low exposure (freeze motion), moderate gain |
| **Studio** | Balanced settings, sharpness boost, slight saturation |
| **Noisy** | ISO 6400, gain 90, zero noise reduction — worst case test |

### Live Histogram

A real-time histogram displays RGB + Luminance distribution based on current camera settings. It updates every 500ms and visualizes:
- Red, Green, Blue channel curves (overlapping)
- Luminance (weighted average)
- Distribution shifts based on exposure/gain/brightness

### Sensor Specs Display

Shows calculated specs based on settings:
- Megapixels, Resolution
- Dynamic Range (dB) — varies with gain
- Signal-to-Noise Ratio (dB) — decreases with ISO
- Min Illumination — 0 Lux when IR enabled
- Shutter speed range — calculated from FPS and exposure

---

## 4. Camera Pipeline (Core Engine)

**File:** `src/utils/imageProcessing.ts` (300 lines)
**Visualization:** `src/components/pipeline/PipelinePanel.tsx` + `PipelineFlow.tsx`

### Pipeline Stages

```
Scene → Lens → Sensor → ISP → Encoder → Stream
```

Each stage applies real pixel-level transformations to the canvas:

#### Stage 1: Scene (Input)
- Source: Webcam video frame or synthetic canvas
- Drawn onto output canvas as base image

#### Stage 2: Lens Module
| Effect | How It Works |
|--------|-------------|
| **Blur** | CSS filter `blur()` applied to canvas |
| **Barrel/Pincushion Distortion** | Per-pixel radial displacement from center. Uses `k * r²` distortion formula |
| **Focus Distance** | Controls blur amount (simulates depth of field) |

Implementation: Reads entire `ImageData`, remaps pixel positions based on distance from center, writes back.

#### Stage 3: Sensor
| Effect | How It Works |
|--------|-------------|
| **Exposure** | Multiplies all RGB values by `exposure / 50` |
| **Gain** | Further multiplies by `1 + (gain/100) * 2` |
| **ISO Noise** | Adds random noise scaled by `ISO / 6400`. Higher ISO = more grain |
| **Brightness** | Adds constant offset to all pixels |
| **Contrast** | Applies `(259 * (C + 255)) / (255 * (259 - C))` formula |
| **Saturation** | Blends between grayscale and color based on factor |
| **Night Mode / IR** | Converts to weighted grayscale with green tint (R*0.9, G*1.1, B*0.9) |
| **Noise Reduction** | Subtracts from noise amount — counterbalances ISO grain |

All operations are per-pixel on raw `ImageData` for realistic results.

#### Stage 4: ISP (Image Signal Processor)
| Effect | How It Works |
|--------|-------------|
| **White Balance** | Adjusts R/B gains based on color temperature (2500K–10000K). Warm = more red, Cool = more blue |
| **Gamma Correction** | Applies `255 * (pixel/255)^(1/γ)` per channel. γ < 1 brightens, γ > 1 darkens |
| **Exposure Compensation** | Multiplies by `2^EV` — each stop doubles/halves brightness |
| **Color Modes** | Normal, Vivid (1.5x saturation), Monochrome (grayscale), Sepia (warm grayscale) |
| **Denoise** | Light Gaussian blur when denoise > 20 |

#### Stage 5: Encoder
| Effect | How It Works |
|--------|-------------|
| **Compression Artifacts** | At low quality, simulates macroblocking by adding noise to random 8×8 (MJPEG) or 16×16 (H.264/H.265) blocks |
| **Quality Control** | Quality < 50% triggers visible artifacts |
| **Codec Selection** | H.264, H.265, MJPEG — affects block size |
| **Bitrate/Rate Control** | CBR/VBR labels (visual config, affects artifact simulation) |

#### Stage 6: Stream
- Protocol simulation (RTSP/WebRTC/HTTP)
- Latency, jitter, packet loss parameters
- Not a real stream — simulated configuration

### Pipeline Visualization Bar

The bottom bar shows all 6 stages with:
- **Animated data flow dots** moving between stages
- **Processing indicator bars** scanning across active stages
- **Per-stage metrics** (lens aperture, ISP white balance, encoder bitrate)
- **ON/OFF indicators** based on preview mode
- **Total latency** counter
- **Frame count** and throughput

---

## 5. Real-Time Preview System

**File:** `src/components/preview/CameraViewport.tsx` (492 lines)

### Preview Modes

| Mode | Pipeline Stages Active | What You See |
|------|----------------------|-------------|
| **Raw** | Scene + Lens + Sensor | Noisy, unprocessed sensor output |
| **Processed** | Scene + Lens + Sensor + ISP | Clean, color-corrected image |
| **Encoded** | All stages | Compressed output with potential artifacts |

### Viewport Features

| Feature | Description |
|---------|-------------|
| **Source Toggle** | Switch between Synthetic scene and live Webcam |
| **Motion Overlay** | Red pixel overlay showing motion-detected areas |
| **Grid Overlay** | Rule-of-thirds composition guide |
| **Crosshair** | Center-point targeting overlay |
| **Zoom** | 50% to 300% zoom with smooth transitions |
| **Snapshot** | Captures current frame as PNG download with flash animation |
| **FPS Counter** | Live frames-per-second display |
| **Frame Time** | Milliseconds per frame (processing time) |
| **Status Badges** | LIVE, REC, motion percentage, preview mode |

### Overlay Information

| Overlay | Position | Content |
|---------|----------|---------|
| **Camera Info** | Top-left | Camera ID, resolution, sensor type, ISO/EXP/GAIN, timestamp, IR status |
| **GPIO LEDs** | Top-right | Active output pins with colored glow indicators |
| **Pipeline Pills** | Bottom-left | Active pipeline stage indicators with colors |
| **Encoder Info** | Bottom-right | Codec, bitrate, rate control, quality |

---

## 6. Event & Detection System

**File:** `src/components/detection/DetectionPanel.tsx` (395 lines)
**Algorithm:** `src/utils/imageProcessing.ts` — `detectMotion()`

### Motion Detection Algorithm

```
For each pixel (i) in current frame:
    rDiff = |current.R - previous.R|
    gDiff = |current.G - previous.G|
    bDiff = |current.B - previous.B|
    avgDiff = (rDiff + gDiff + bDiff) / 3

    if avgDiff > adjustedThreshold:
        mark pixel as changed (red overlay)
        changedPixels++

    diffPercentage = changedPixels / totalPixels * 100
    detected = diffPercentage > sensitivityThreshold
```

**Parameters:**
- **Sensitivity** (0–100): Lower = more sensitive to small changes
- **Threshold** (5–100): Minimum per-pixel difference to count as motion

### Motion Heatmap

A 16×12 grid canvas that:
- Tracks motion intensity per cell
- Decays heat over time (multiplied by 0.92 each frame)
- Simulates specific motion areas (walking person zone, car zone)
- Color-maps from black → red → yellow based on intensity

### Detection Zones

Three configurable zones:
- **Zone A — Entrance** (blue)
- **Zone B — Parking** (green)
- **Zone C — Perimeter** (yellow)

Each zone can be independently enabled/disabled.

### Motion Statistics

| Stat | Description |
|------|-------------|
| Events Today | Cumulative motion events |
| Avg Duration | Average motion event duration (simulated) |
| Peak Hour | Hour with most events |
| Last Event | Timestamp of most recent motion |

### Trigger Actions

When motion is detected, these can fire:

| Action | What Happens |
|--------|-------------|
| **LED ON (GPIO 17)** | Toggles the status LED on the embedded board |
| **Send Alert** | Creates a warning event in the event log |
| **Start Recording** | Sets isRecording=true for 5 seconds, shows REC badge |
| **Activate Buzzer (GPIO 22)** | Toggles the buzzer alarm GPIO pin |

### Auto-Triggers (on sustained motion)

- GPIO 17 (LED) automatically goes HIGH for 2 seconds
- Event logged with pixel change percentage
- Cooldown: 3 seconds between auto-trigger events

---

## 7. Embedded System Integration

**File:** `src/components/embedded/EmbeddedPanel.tsx` (596 lines)

### Supported Boards

| Board | CPU | RAM | Camera | Connectivity |
|-------|-----|-----|--------|-------------|
| **Raspberry Pi 4B** | BCM2711 ARM Cortex-A72 1.5GHz | 4GB LPDDR4 | CSI-2 (IMX219/IMX477) | WiFi, BT, ETH, USB3 |
| **ESP32-CAM** | ESP32-S Xtensa LX6 240MHz | 520KB SRAM + 4MB PSRAM | OV2640 (2MP) | WiFi, BT |
| **Custom SBC** | Custom ARM/RISC-V | Configurable | MIPI CSI / USB | WiFi, ETH |

### System Monitor (Live)

All values fluctuate in real-time (±8% CPU, ±3% Memory, ±2°C Temp every 2 seconds):

| Metric | Indicator | Threshold Colors |
|--------|-----------|-----------------|
| **CPU Usage** | Progress bar + percentage | Green < 60%, Yellow < 80%, Red > 80% |
| **Memory** | Progress bar + percentage | Blue < 80%, Red > 80% |
| **Temperature** | Progress bar + °C | Green < 55°C, Yellow < 70°C, Red > 70°C |

### GPIO Pin Configuration

8 configurable pins with click-to-toggle:

| GPIO | Label | Mode | Type | Purpose |
|------|-------|------|------|---------|
| 2 | SDA (I2C) | Input | I2C | I2C data line |
| 3 | SCL (I2C) | Input | I2C | I2C clock line |
| 4 | PIR Sensor | Input | Digital | Motion sensor input |
| 17 | LED Status | Output | Digital | Status indicator LED |
| 18 | IR LED PWM | Output | PWM | Infrared illumination |
| 22 | Buzzer | Output | Digital | Alarm buzzer |
| 23 | Button Input | Input | Digital | Manual trigger button |
| 24 | Relay Output | Output | Digital | NVR relay control |

Each pin shows: GPIO number, label, type badge (DIGITAL/PWM/I2C), state (HIGH/LOW), active indicator dot.

### Wiring Diagram

A canvas-drawn schematic showing:
- Board PCB (green rectangle with rounded corners)
- CPU chip on board
- CSI camera connector with flat cable
- USB and Ethernet ports
- Left-side and right-side GPIO pins with wires to component boxes
- Color-coded active/inactive states
- Camera module connected via ribbon cable
- Power LED

### Serial Console

An interactive terminal emulator that accepts commands:

| Command | Output |
|---------|--------|
| `ls` | `camera.py config.json stream.sh detect.py logs/` |
| `gpio readall` | Full GPIO pin state table |
| `vcgencmd measure_temp` | Current board temperature |
| `raspistill -o test.jpg` | Simulated camera capture |
| `v4l2-ctl --list-devices` | Lists virtual camera devices |
| `free -h` | Memory usage display |
| `top` | CPU, memory, temperature summary |
| `ifconfig` | Network interface info |
| `cat /proc/cpuinfo` | Hardware model info |
| `help` | Lists all available commands |
| `clear` | Clears console output |

Boot sequence on load:
```
[0.000] Booting embedded Linux kernel...
[0.120] CPU: ARM Cortex-A72 @ 1.5GHz
[0.250] RAM: 4096MB detected
[0.400] Loading device tree...
[0.800] CSI camera module detected
[1.200] Initializing V4L2 driver...
[1.500] Camera: IMX219 1920x1080 @ 30fps
[2.000] Network: wlan0 UP 192.168.1.100
[2.500] System ready.
```

GPIO changes are automatically logged to the console.

---

## 8. Networking Simulation

**File:** `src/components/network/NetworkPanel.tsx` (158 lines)

### Protocols

| Protocol | Default Port | Description |
|----------|-------------|-------------|
| **RTSP** | 554 | Real Time Streaming Protocol (Live555-style) |
| **WebRTC** | 8443 | Web Real-Time Communication |
| **HTTP** | 8080 | HTTP snapshot / MJPEG streaming |

### Network Condition Simulation

| Parameter | Range | Description |
|-----------|-------|-------------|
| **Latency** | 0–500ms | Network delay |
| **Packet Loss** | 0–50% | Dropped packet simulation |
| **Jitter** | 0–100ms | Latency variation |

### Simulated HTTP API Endpoints

```
GET  /api/snapshot         — Capture current frame
GET  /api/stream/status    — Check stream status
POST /api/camera/config    — Update camera settings
GET  /api/events           — Fetch event log
```

### Stream Statistics Display

- Resolution, FPS, Codec
- Bitrate
- Effective latency (base + jitter)
- Packet loss percentage
- Stream URL with protocol and port

---

## 9. Developer Mode

**File:** `src/components/developer/DeveloperPanel.tsx` (731 lines)

### Code Templates

| Template | Language | Description |
|----------|----------|-------------|
| **Frame Capture** | C | V4L2 frame capture callback with YUYV→RGB pixel access |
| **Encoder Setup** | C | Hardware H.264 encoder initialization with QP range, profile, rate control |
| **RTSP Stream** | C | RTSP server with RTP packetization and NAL unit streaming |
| **GPIO Motion** | C | WiringPi-based PIR interrupt handler with LED, buzzer, IR, relay control |
| **ISP Pipeline** | C | Full ISP stages: black level, defective pixel, white balance, gamma |
| **Python OpenCV** | Python | OpenCV camera capture with motion detection using contour analysis |

### Editor Features

- **Syntax Highlighting** — Keywords (blue), strings (orange), comments (green), numbers (light green), preprocessor (purple), function calls (yellow)
- **VS Code-style UI** — File tab with language badge, line count, status bar
- **Editable** — Click highlighted view to switch to edit mode
- **Copy to clipboard** button

### Mock Execution

When "Build & Run" is clicked:

1. Shows compilation command (`gcc -O2 -Wall ...` or `python3 ...`)
2. Reports "Build successful ✓"
3. Displays realistic mock output specific to each template
4. Reports exit code and execution time
5. Logs event to the event system

Example output for GPIO template:
```
> gcc -O2 -Wall -o gpio gpio.c -lcamera -lencoder
> Build successful ✓
> ./gpio

[SYS] Camera security system active
[SYS] GPIO4: PIR INPUT (PULL_DOWN)
[SYS] GPIO17: LED OUTPUT
[SYS] GPIO18: IR PWM OUTPUT
[SYS] Waiting for motion...
[GPIO] Motion on pin 4!
[CAM] Recording started
[IR] Night vision ON
> Motion sequence: LED=ON BUZZER=ON IR=1024

> Process exited (code 0) [1.3s]
```

---

## 10. Synthetic Scene Engine

**File:** `src/hooks/useSyntheticVideo.ts` (739 lines)

The synthetic scene is a procedurally-generated surveillance camera view rendered at 60fps on a hidden canvas.

### Environment System

#### Time of Day (auto-cycles every ~40 seconds)
| Time | Sky | Lighting | Stars |
|------|-----|----------|-------|
| **Night** | Deep navy → dark blue | Moon + streetlight glow | 120 twinkling stars |
| **Dusk** | Purple → orange → warm | Setting sun with glow | None |
| **Day** | Sky blue gradient | Sun with glow | None |

#### Weather (auto-cycles every ~60 seconds)
| Weather | Effects |
|---------|---------|
| **Clear** | Normal visibility, stars visible at night |
| **Cloudy** | Dense cloud cover (2.5x opacity), obscures stars |
| **Rain** | 200 animated raindrops with streak effect, puddle reflections on road |
| **Fog** | Gradient fog overlay from 30% to 60% opacity |

### Scene Elements

| Element | Details |
|---------|---------|
| **6 Buildings** | Variable heights, lit windows with slow flicker, antennas with blinking red lights |
| **Road** | Two lanes with dashed center line (animated), edge lines, crosswalk |
| **Sidewalks** | Two walking paths flanking the road |
| **3 Cars** | Red sedan (moving right), blue SUV (moving left), parked white van. Night: headlight beams and taillight glow |
| **4 People** | Animated walking with limb movement, bobbing, hair, shoes. One standing (loitering) |
| **1 Dog** | Walking with person, animated tail wag and legs |
| **4 Birds** | Daytime only, flapping wings across sky |
| **4 Trees** | Multi-layer foliage with wind sway |
| **3 Streetlights** | Pole, arm, fixture, light glow cone (stronger at night) |
| **1 Traffic Light** | Cycles red → yellow → green every 3 seconds with glow |
| **Distant Hills** | Sinusoidal mountain silhouette |
| **Clouds** | 6 multi-ellipse clouds drifting across sky |
| **Stars** | 120 stars with individual twinkle speed and brightness |
| **Moon** | Detailed with craters and ambient glow |

### Security Camera Overlay

- Corner bracket marks (top-left, top-right, bottom-left, bottom-right)
- Camera ID (CAM-01), resolution, sensor type
- Date and timestamp with milliseconds
- Blinking "REC" indicator with red dot

---

## 11. UI/UX Architecture

### Layout

```
┌─── Sidebar (56–200px) ─┬─── Header (48px) ────────────────────┐
│                         │                                       │
│  CamSim Logo            │  Camera Sim Engine | 1080p@30fps      │
│                         │  [Start Stream] [Record] [Fullscreen] │
│  ● Camera               ├──────────────────────┬───────────────┤
│  ● Pipeline              │                      │               │
│  ● Preview               │                      │  Right Panel  │
│  ● Detection             │   Camera Viewport    │  (320px)      │
│  ● Embedded              │   (Main Canvas)      │               │
│  ● Network               │                      │  Contextual   │
│  ● Developer             │                      │  controls     │
│  ● Events                │                      │  based on     │
│                         │                      │  active tab   │
│  v1.0                   ├──────────────────────┴───────────────┤
│                         │  Pipeline Flow Bar (96px)             │
└─────────────────────────┴─────────────────────────────────────┘
```

### Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0f1117` | Page background |
| `--bg-secondary` | `#1a1d27` | Panels, sidebar |
| `--bg-tertiary` | `#252836` | Cards, inputs |
| `--border-color` | `#2d3148` | All borders |
| `--text-primary` | `#e4e4e7` | Main text |
| `--text-secondary` | `#a1a1aa` | Labels, hints |
| `--accent` | `#3b82f6` | Primary actions |
| `--success` | `#22c55e` | Active/OK states |
| `--warning` | `#eab308` | Caution indicators |
| `--danger` | `#ef4444` | Motion alerts, recording |

**Pipeline Stage Colors:**
- Scene: `#8b5cf6` (purple)
- Lens: `#06b6d4` (cyan)
- Sensor: `#f59e0b` (amber)
- ISP: `#10b981` (emerald)
- Encoder: `#ec4899` (pink)
- Stream: `#3b82f6` (blue)

### Reusable Components

| Component | Props | Usage |
|-----------|-------|-------|
| `SliderControl` | label, value, min, max, step, unit, onChange | All range sliders across panels |
| `ToggleSwitch` | label, checked, onChange | On/off toggles |
| `SectionHeader` | icon, title, subtitle | Panel section headers |

---

## 12. File Structure & Code Map

```
camera-sim/
├── src/
│   ├── main.tsx                          (10 lines)   Entry point
│   ├── App.tsx                           (70 lines)   Root component
│   ├── index.css                         (91 lines)   Global styles
│   │
│   ├── types/
│   │   └── camera.ts                    (112 lines)   All TypeScript interfaces
│   │
│   ├── contexts/
│   │   └── CameraContext.tsx            (182 lines)   Global state provider
│   │
│   ├── hooks/
│   │   ├── useWebcam.ts                  (44 lines)   getUserMedia wrapper
│   │   └── useSyntheticVideo.ts         (739 lines)   Scene generator
│   │
│   ├── utils/
│   │   └── imageProcessing.ts           (300 lines)   Pixel processing pipeline
│   │
│   └── components/
│       ├── common/
│       │   ├── SliderControl.tsx          (35 lines)   Range slider
│       │   ├── ToggleSwitch.tsx           (31 lines)   Toggle switch
│       │   └── SectionHeader.tsx          (25 lines)   Section header
│       │
│       ├── layout/
│       │   ├── Header.tsx               (102 lines)   Top bar
│       │   └── Sidebar.tsx              (111 lines)   Navigation
│       │
│       ├── camera/
│       │   └── CameraPanel.tsx          (405 lines)   Sensor controls + presets + histogram
│       │
│       ├── pipeline/
│       │   ├── PipelinePanel.tsx         (141 lines)   Pipeline config UI
│       │   └── PipelineFlow.tsx          (225 lines)   Animated pipeline bar
│       │
│       ├── preview/
│       │   ├── CameraViewport.tsx        (492 lines)   Main canvas + overlays
│       │   └── PreviewPanel.tsx           (75 lines)   Mode selection
│       │
│       ├── detection/
│       │   └── DetectionPanel.tsx        (395 lines)   Motion detection + heatmap
│       │
│       ├── embedded/
│       │   └── EmbeddedPanel.tsx         (596 lines)   Board + GPIO + wiring + console
│       │
│       ├── network/
│       │   └── NetworkPanel.tsx          (158 lines)   Protocol + network sim
│       │
│       ├── developer/
│       │   └── DeveloperPanel.tsx        (731 lines)   Code editor + mock execution
│       │
│       └── events/
│           └── EventsPanel.tsx          (109 lines)   Event log + export
│
├── vite.config.ts                        Vite + React + Tailwind
├── tsconfig.json                         TypeScript configuration
├── package.json                          Dependencies
└── index.html                            HTML entry
```

### Code Distribution

| Category | Lines | % |
|----------|-------|---|
| Components | 3,631 | 70% |
| Hooks (Scene + Webcam) | 783 | 15% |
| Image Processing | 300 | 6% |
| Context (State) | 182 | 4% |
| Types | 112 | 2% |
| App + Entry | 80 | 1% |
| Styles | 91 | 2% |
| **Total** | **~5,179** | **100%** |

---

## 13. Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI framework |
| **TypeScript** | 5.9 | Type safety |
| **Vite** | 8.0 | Build tool & dev server |
| **Tailwind CSS** | 4.2 | Utility-first CSS |
| **Lucide React** | 0.577 | Icon library (Camera, Cpu, Wifi, Code, etc.) |
| **Canvas API** | Native | All image processing and rendering |
| **getUserMedia** | WebRTC | Live webcam access |
| **requestAnimationFrame** | Native | 60fps render loop |
| **ImageData API** | Native | Per-pixel manipulation |

### No External Processing Libraries

All image processing is implemented from scratch using:
- `CanvasRenderingContext2D.getImageData()` / `putImageData()`
- Direct pixel manipulation on `Uint8ClampedArray`
- CSS `filter` property for blur operations
- Mathematical formulas for distortion, gamma, white balance

---

## 14. How It Works — End to End

### Frame Lifecycle

```
1. INPUT
   ├─ Synthetic: useSyntheticVideo draws scene to hidden canvas (60fps)
   └─ Webcam: getUserMedia stream → hidden <video> element

2. CAPTURE
   └─ getSourceCanvas() returns either synthetic canvas or webcam-to-canvas

3. PROCESS (processFrame function)
   ├─ Draw source onto output canvas
   ├─ applyLensEffects() — blur, barrel distortion
   ├─ applySensorEffects() — exposure, gain, ISO noise, night/IR
   ├─ [if mode ≥ 'processed'] applyISPEffects() — WB, gamma, color, denoise
   └─ [if mode = 'encoded'] applyEncoderEffects() — compression artifacts

4. DETECT (if motion detection enabled)
   ├─ getImageData() from output canvas
   ├─ detectMotion() compares with previous frame
   ├─ Update motion percentage and detected flag
   ├─ Draw motion overlay (red pixels on difference areas)
   └─ If detected: trigger events, GPIO LED, heatmap update

5. DISPLAY
   ├─ Output canvas shown in viewport
   ├─ Motion overlay canvas layered on top (50% opacity)
   ├─ Grid / crosshair SVG overlays if enabled
   ├─ Camera info, GPIO LEDs, pipeline pills, encoder info overlaid
   └─ FPS counter and frame time updated

6. REPEAT at requestAnimationFrame rate (capped to target FPS)
```

### Event Cascade Example: Motion Detection

```
1. Person walks in synthetic scene
2. Pixel difference exceeds threshold
3. detectMotion() returns { detected: true, diffPercentage: 8.3% }
4. motionDetected state → true
5. Header shows "MOTION" badge (pulsing red)
6. Detection panel status card turns red
7. Heatmap updates with hot spots
8. GPIO 17 (LED) → HIGH (auto-triggered)
9. Event logged: "Motion detected (8.3% pixel change)"
10. After 2 seconds: GPIO 17 → LOW
11. 3-second cooldown before next auto-trigger
```

---

## Summary

The Camera Simulation Engine is a comprehensive, browser-based platform that replicates the full embedded camera development experience:

- **5,179 lines** of TypeScript/React code
- **24 source files** organized into clean modules
- **6-stage image processing pipeline** with per-pixel Canvas manipulation
- **Procedurally generated surveillance scene** with weather, time-of-day, vehicles, people
- **Real-time motion detection** with heatmap, zones, and GPIO auto-triggers
- **3 embedded board simulations** with GPIO, system monitor, and serial console
- **6 code templates** with syntax highlighting and mock compilation
- **Zero external dependencies** for image processing — all native Canvas API

It enables developers to design, test, and visualize camera-based embedded systems entirely in the browser — no Raspberry Pi, no soldering, no physical cameras required.
