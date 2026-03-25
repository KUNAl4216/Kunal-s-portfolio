export type SensorType = 'CMOS' | 'CCD';
export type Resolution = '720p' | '1080p' | '4MP' | '5MP';
export type DayNightMode = 'day' | 'night' | 'auto';
export type EncoderType = 'H264' | 'H265' | 'MJPEG';
export type PreviewMode = 'raw' | 'processed' | 'encoded';
export type StreamProtocol = 'RTSP' | 'WebRTC' | 'HTTP';
export type BoardType = 'raspberry-pi' | 'esp32' | 'custom';

export interface ResolutionConfig {
  label: string;
  width: number;
  height: number;
}

export const RESOLUTIONS: Record<Resolution, ResolutionConfig> = {
  '720p': { label: '720p HD', width: 1280, height: 720 },
  '1080p': { label: '1080p Full HD', width: 1920, height: 1080 },
  '4MP': { label: '4MP', width: 2560, height: 1440 },
  '5MP': { label: '5MP', width: 2592, height: 1944 },
};

export interface CameraConfig {
  sensorType: SensorType;
  resolution: Resolution;
  fps: number;
  exposure: number;       // 0-100
  gain: number;           // 0-100
  iso: number;            // 100-6400
  dayNightMode: DayNightMode;
  irEnabled: boolean;
  noiseReduction: number; // 0-100
  brightness: number;     // -50 to 50
  contrast: number;       // -50 to 50
  saturation: number;     // -50 to 50
  sharpness: number;      // 0-100
}

export interface LensConfig {
  focalLength: number;    // mm
  aperture: number;       // f-stop
  blur: number;           // 0-100
  distortion: number;     // -50 to 50
  focusDistance: number;   // 0-100
}

export interface ISPConfig {
  whiteBalance: number;   // 2500-10000 Kelvin
  autoExposure: boolean;
  exposureCompensation: number; // -3 to 3 EV
  gamma: number;          // 0.1 to 3.0
  denoise: number;        // 0-100
  colorMode: 'normal' | 'vivid' | 'monochrome' | 'sepia';
}

export interface EncoderConfig {
  codec: EncoderType;
  bitrate: number;        // kbps
  keyframeInterval: number; // frames
  quality: number;        // 0-100
  rateControl: 'CBR' | 'VBR';
}

export interface StreamConfig {
  protocol: StreamProtocol;
  port: number;
  latency: number;        // ms
  packetLoss: number;     // 0-100 %
  jitter: number;         // ms
  enabled: boolean;
}

export interface DetectionConfig {
  motionEnabled: boolean;
  motionSensitivity: number; // 0-100
  motionThreshold: number;   // 0-255
  objectDetectionEnabled: boolean;
  faceDetectionEnabled: boolean;
}

export interface GPIOPin {
  id: number;
  label: string;
  mode: 'input' | 'output';
  state: boolean;
  type: 'digital' | 'pwm' | 'i2c' | 'spi';
}

export interface EmbeddedBoard {
  type: BoardType;
  name: string;
  pins: GPIOPin[];
  cameraConnected: boolean;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
}

export interface EventLog {
  id: string;
  timestamp: Date;
  type: 'motion' | 'object' | 'face' | 'gpio' | 'stream' | 'system';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface PipelineStage {
  name: string;
  color: string;
  enabled: boolean;
  processing: boolean;
  latencyMs: number;
}
