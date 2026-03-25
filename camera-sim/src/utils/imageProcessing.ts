import type { CameraConfig, LensConfig, ISPConfig, EncoderConfig, PreviewMode } from '../types/camera';

export function applyLensEffects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  lens: LensConfig
) {
  if (lens.blur > 0) {
    ctx.filter = `blur(${lens.blur * 0.1}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  }

  if (lens.distortion !== 0) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const k = lens.distortion * 0.00001;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy) / maxR;
        const factor = 1 + k * r * r;
        const srcX = Math.round(cx + dx * factor);
        const srcY = Math.round(cy + dy * factor);

        if (srcX >= 0 && srcX < canvas.width && srcY >= 0 && srcY < canvas.height) {
          const dstIdx = (y * canvas.width + x) * 4;
          const srcIdx = (srcY * canvas.width + srcX) * 4;
          data[dstIdx] = copy[srcIdx];
          data[dstIdx + 1] = copy[srcIdx + 1];
          data[dstIdx + 2] = copy[srcIdx + 2];
          data[dstIdx + 3] = copy[srcIdx + 3];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
}

export function applySensorEffects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  camera: CameraConfig
) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const brightnessOffset = camera.brightness * 2.55;
  const contrastFactor = (259 * (camera.contrast * 2.55 + 255)) / (255 * (259 - camera.contrast * 2.55));
  const gainMultiplier = 1 + (camera.gain / 100) * 2;
  const exposureFactor = camera.exposure / 50;
  const isNight = camera.dayNightMode === 'night' || camera.irEnabled;

  // Noise based on ISO and low light
  const noiseAmount = Math.max(0, (camera.iso / 6400) * 40 - (camera.noiseReduction / 100) * 20);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply exposure
    r *= exposureFactor;
    g *= exposureFactor;
    b *= exposureFactor;

    // Apply gain
    r *= gainMultiplier;
    g *= gainMultiplier;
    b *= gainMultiplier;

    // Apply brightness
    r += brightnessOffset;
    g += brightnessOffset;
    b += brightnessOffset;

    // Apply contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Apply saturation
    if (camera.saturation !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const satFactor = 1 + camera.saturation / 50;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);
    }

    // Night mode / IR simulation
    if (isNight) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray * 0.9;
      g = gray * 1.1;
      b = gray * 0.9;
    }

    // Add noise
    if (noiseAmount > 0) {
      const noise = (Math.random() - 0.5) * noiseAmount;
      r += noise;
      g += noise;
      b += noise;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}

export function applyISPEffects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  isp: ISPConfig
) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // White balance adjustment
  const wbNormalized = (isp.whiteBalance - 5500) / 4500;
  const rGain = 1 + wbNormalized * 0.3;
  const bGain = 1 - wbNormalized * 0.3;

  // Gamma correction
  const gammaInv = 1 / isp.gamma;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // White balance
    r = r * rGain;
    b = b * bGain;

    // Gamma correction
    r = 255 * Math.pow(r / 255, gammaInv);
    g = 255 * Math.pow(g / 255, gammaInv);
    b = 255 * Math.pow(b / 255, gammaInv);

    // Exposure compensation
    if (isp.exposureCompensation !== 0) {
      const evFactor = Math.pow(2, isp.exposureCompensation);
      r *= evFactor;
      g *= evFactor;
      b *= evFactor;
    }

    // Color mode
    if (isp.colorMode === 'monochrome') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gray;
    } else if (isp.colorMode === 'sepia') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray * 1.2;
      g = gray * 1.0;
      b = gray * 0.8;
    } else if (isp.colorMode === 'vivid') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + 1.5 * (r - gray);
      g = gray + 1.5 * (g - gray);
      b = gray + 1.5 * (b - gray);
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);

  // Denoise (simple blur-based)
  if (isp.denoise > 20) {
    ctx.filter = `blur(${(isp.denoise - 20) * 0.02}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  }
}

export function applyEncoderEffects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  encoder: EncoderConfig
) {
  // Simulate compression artifacts
  const quality = encoder.quality / 100;
  const blockSize = encoder.codec === 'MJPEG' ? 8 : 16;

  if (quality < 0.5) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const artifactStrength = (1 - quality) * 30;

    // Simulate macroblocking at low bitrates
    for (let by = 0; by < canvas.height; by += blockSize) {
      for (let bx = 0; bx < canvas.width; bx += blockSize) {
        if (Math.random() > quality) {
          const noise = (Math.random() - 0.5) * artifactStrength;
          for (let y = by; y < Math.min(by + blockSize, canvas.height); y++) {
            for (let x = bx; x < Math.min(bx + blockSize, canvas.width); x++) {
              const idx = (y * canvas.width + x) * 4;
              data[idx] = Math.max(0, Math.min(255, data[idx] + noise));
              data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noise));
              data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noise));
            }
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
}

export function processFrame(
  sourceCanvas: HTMLCanvasElement,
  outputCanvas: HTMLCanvasElement,
  camera: CameraConfig,
  lens: LensConfig,
  isp: ISPConfig,
  encoder: EncoderConfig,
  previewMode: PreviewMode
) {
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return;

  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;

  ctx.drawImage(sourceCanvas, 0, 0);

  // Apply pipeline stages based on preview mode
  applyLensEffects(ctx, outputCanvas, lens);
  applySensorEffects(ctx, outputCanvas, camera);

  if (previewMode === 'raw') return;

  applyISPEffects(ctx, outputCanvas, isp);

  if (previewMode === 'processed') return;

  applyEncoderEffects(ctx, outputCanvas, encoder);
}

export function detectMotion(
  currentFrame: ImageData,
  previousFrame: ImageData | null,
  threshold: number,
  sensitivity: number
): { detected: boolean; diffPercentage: number; diffCanvas?: ImageData } {
  if (!previousFrame || currentFrame.width !== previousFrame.width || currentFrame.height !== previousFrame.height) {
    return { detected: false, diffPercentage: 0 };
  }

  const curr = currentFrame.data;
  const prev = previousFrame.data;
  const diff = new Uint8ClampedArray(curr.length);
  let changedPixels = 0;
  const totalPixels = curr.length / 4;
  const adjustedThreshold = threshold * (1 + (100 - sensitivity) / 100);

  for (let i = 0; i < curr.length; i += 4) {
    const rDiff = Math.abs(curr[i] - prev[i]);
    const gDiff = Math.abs(curr[i + 1] - prev[i + 1]);
    const bDiff = Math.abs(curr[i + 2] - prev[i + 2]);
    const avgDiff = (rDiff + gDiff + bDiff) / 3;

    if (avgDiff > adjustedThreshold) {
      changedPixels++;
      diff[i] = 255;
      diff[i + 1] = 0;
      diff[i + 2] = 0;
      diff[i + 3] = 180;
    } else {
      diff[i] = 0;
      diff[i + 1] = 0;
      diff[i + 2] = 0;
      diff[i + 3] = 0;
    }
  }

  const diffPercentage = (changedPixels / totalPixels) * 100;
  const sensitivityThreshold = (100 - sensitivity) / 10;
  const detected = diffPercentage > sensitivityThreshold;

  return {
    detected,
    diffPercentage,
    diffCanvas: new ImageData(diff, currentFrame.width, currentFrame.height),
  };
}
