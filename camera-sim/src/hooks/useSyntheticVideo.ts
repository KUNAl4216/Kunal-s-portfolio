import { useRef, useCallback, useEffect } from 'react';

interface Star { x: number; y: number; size: number; brightness: number; twinkleSpeed: number }
interface Cloud { x: number; y: number; w: number; h: number; speed: number; opacity: number }
interface Raindrop { x: number; y: number; speed: number; length: number }
interface Bird { x: number; y: number; speed: number; wingPhase: number }

export type WeatherMode = 'clear' | 'cloudy' | 'rain' | 'fog';
export type TimeOfDay = 'day' | 'dusk' | 'night';

export function useSyntheticVideo(width = 640, height = 480) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const rainRef = useRef<Raindrop[]>([]);
  const birdsRef = useRef<Bird[]>([]);
  const windowStateRef = useRef<boolean[]>([]);
  const weatherRef = useRef<WeatherMode>('clear');
  const timeOfDayRef = useRef<TimeOfDay>('night');

  // Seed stable randomness for windows
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const initScene = useCallback(() => {
    // Stars
    starsRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.5,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 3 + 1,
    }));

    // Clouds
    cloudsRef.current = Array.from({ length: 6 }, () => ({
      x: Math.random() * width * 1.5,
      y: Math.random() * height * 0.25 + 10,
      w: Math.random() * 120 + 80,
      h: Math.random() * 30 + 15,
      speed: Math.random() * 8 + 3,
      opacity: Math.random() * 0.4 + 0.15,
    }));

    // Rain
    rainRef.current = Array.from({ length: 200 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 6 + 6,
      length: Math.random() * 12 + 6,
    }));

    // Birds
    birdsRef.current = Array.from({ length: 4 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.3 + 20,
      speed: Math.random() * 30 + 20,
      wingPhase: Math.random() * Math.PI * 2,
    }));

    // Window states (stable per frame cycle)
    windowStateRef.current = Array.from({ length: 200 }, (_, i) => seededRandom(i) > 0.35);
  }, [width, height]);

  const drawScene = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const w = width;
    const h = height;
    const tod = timeOfDayRef.current;
    const weather = weatherRef.current;

    // ===== SKY =====
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    if (tod === 'night') {
      skyGrad.addColorStop(0, '#0a0a1e');
      skyGrad.addColorStop(0.5, '#141432');
      skyGrad.addColorStop(1, '#1e2a50');
    } else if (tod === 'dusk') {
      skyGrad.addColorStop(0, '#1a1040');
      skyGrad.addColorStop(0.3, '#4a2060');
      skyGrad.addColorStop(0.6, '#c05030');
      skyGrad.addColorStop(1, '#e08040');
    } else {
      skyGrad.addColorStop(0, '#3388cc');
      skyGrad.addColorStop(0.6, '#66aadd');
      skyGrad.addColorStop(1, '#99ccee');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    // ===== MOON / SUN =====
    if (tod === 'night') {
      // Moon
      const moonX = w * 0.78;
      const moonY = h * 0.12;
      ctx.save();
      ctx.shadowColor = '#aaccff';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#dde8f0';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
      ctx.fill();
      // Moon craters
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ccd8e0';
      ctx.beginPath();
      ctx.arc(moonX - 6, moonY - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX + 5, moonY + 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX + 2, moonY - 8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Stars
      for (const star of starsRef.current) {
        if (weather === 'cloudy' || weather === 'rain') continue;
        const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.brightness * 10);
        ctx.fillStyle = `rgba(255, 255, 240, ${twinkle * star.brightness * 0.8})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (tod === 'dusk') {
      // Setting sun
      ctx.save();
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 50;
      const sunY = h * 0.5;
      ctx.fillStyle = '#ff8833';
      ctx.beginPath();
      ctx.arc(w * 0.82, sunY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Sun
      ctx.save();
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 40;
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      ctx.arc(w * 0.8, h * 0.12, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ===== CLOUDS =====
    for (const cloud of cloudsRef.current) {
      const cx = ((cloud.x + t * cloud.speed) % (w + cloud.w * 2)) - cloud.w;
      const opacity = weather === 'cloudy' || weather === 'rain' ? cloud.opacity * 2.5 : cloud.opacity;
      const baseColor = tod === 'night' ? '40,40,60' : tod === 'dusk' ? '120,60,40' : '220,230,240';
      ctx.fillStyle = `rgba(${baseColor}, ${Math.min(opacity, 0.85)})`;

      // Multi-ellipse cloud shape
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.ellipse(
          cx + j * cloud.w * 0.22,
          cloud.y + Math.sin(j * 1.2) * cloud.h * 0.2,
          cloud.w * 0.3,
          cloud.h * (0.6 + j * 0.1),
          0, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }

    // ===== DISTANT HILLS =====
    ctx.fillStyle = tod === 'night' ? '#0e1520' : tod === 'dusk' ? '#2a1818' : '#446644';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.6);
    for (let x = 0; x <= w; x += 10) {
      const hillY = h * 0.55 + Math.sin(x * 0.008 + 1) * 15 + Math.sin(x * 0.02 + 3) * 8;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(w, h * 0.6);
    ctx.closePath();
    ctx.fill();

    // ===== GROUND =====
    const groundGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    if (tod === 'night') {
      groundGrad.addColorStop(0, '#151e15');
      groundGrad.addColorStop(1, '#0c140c');
    } else if (tod === 'dusk') {
      groundGrad.addColorStop(0, '#2a2a1a');
      groundGrad.addColorStop(1, '#1a1a10');
    } else {
      groundGrad.addColorStop(0, '#4a6a3a');
      groundGrad.addColorStop(1, '#3a5a2a');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.58, w, h * 0.42);

    // ===== SIDEWALKS =====
    ctx.fillStyle = tod === 'night' ? '#252525' : '#888';
    ctx.fillRect(w * 0.26, h * 0.6, w * 0.06, h * 0.4);
    ctx.fillRect(w * 0.68, h * 0.6, w * 0.06, h * 0.4);

    // ===== ROAD =====
    const roadGrad = ctx.createLinearGradient(w * 0.32, 0, w * 0.68, 0);
    roadGrad.addColorStop(0, tod === 'night' ? '#1a1a1a' : '#444');
    roadGrad.addColorStop(0.5, tod === 'night' ? '#222' : '#555');
    roadGrad.addColorStop(1, tod === 'night' ? '#1a1a1a' : '#444');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(w * 0.32, h * 0.6, w * 0.36, h * 0.4);

    // Road lane markings
    ctx.strokeStyle = '#ddcc00';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    ctx.lineDashOffset = -t * 50;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.6);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Road edge lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.6);
    ctx.lineTo(w * 0.32, h);
    ctx.moveTo(w * 0.68, h * 0.6);
    ctx.lineTo(w * 0.68, h);
    ctx.stroke();

    // ===== CROSSWALK =====
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(w * 0.33 + i * w * 0.057, h * 0.88, w * 0.035, 6);
    }

    // ===== BUILDINGS =====
    const buildings = [
      { x: 0.0, bw: 0.12, floors: 7, hue: 220 },
      { x: 0.11, bw: 0.08, floors: 5, hue: 200 },
      { x: 0.18, bw: 0.10, floors: 9, hue: 240 },
      { x: 0.74, bw: 0.09, floors: 6, hue: 210 },
      { x: 0.82, bw: 0.10, floors: 8, hue: 230 },
      { x: 0.91, bw: 0.10, floors: 4, hue: 250 },
    ];

    let winIdx = 0;
    for (const bld of buildings) {
      const bx = bld.x * w;
      const bw2 = bld.bw * w;
      const floorH = 16;
      const bh = bld.floors * floorH;
      const by = h * 0.6 - bh;

      // Building body
      const bGrad = ctx.createLinearGradient(bx, by, bx + bw2, by);
      const lightness = tod === 'night' ? 12 : tod === 'dusk' ? 18 : 30;
      bGrad.addColorStop(0, `hsl(${bld.hue}, 15%, ${lightness}%)`);
      bGrad.addColorStop(1, `hsl(${bld.hue}, 15%, ${lightness + 5}%)`);
      ctx.fillStyle = bGrad;
      ctx.fillRect(bx, by, bw2, bh);

      // Roof detail
      ctx.fillStyle = `hsl(${bld.hue}, 10%, ${lightness - 3}%)`;
      ctx.fillRect(bx, by, bw2, 3);

      // Antenna on tall buildings
      if (bld.floors > 6) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx + bw2 / 2, by);
        ctx.lineTo(bx + bw2 / 2, by - 18);
        ctx.stroke();
        // Blinking red light
        if (Math.sin(t * 3) > 0) {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(bx + bw2 / 2, by - 18, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Windows with stable state
      const winPerRow = Math.floor(bw2 / 14);
      for (let fy = 0; fy < bld.floors; fy++) {
        for (let fx = 0; fx < winPerRow; fx++) {
          const isLit = windowStateRef.current[winIdx % windowStateRef.current.length];
          // Occasionally toggle (slow flicker)
          const flicker = Math.sin(t * 0.3 + winIdx * 7) > 0.95;

          if ((isLit && !flicker) || (!isLit && flicker)) {
            const warmth = seededRandom(winIdx * 3) * 40;
            ctx.fillStyle = tod === 'night'
              ? `rgba(${255 - warmth}, ${230 - warmth}, ${150 + warmth * 0.5}, 0.9)`
              : tod === 'dusk'
                ? `rgba(${240 - warmth}, ${200 - warmth}, ${140 + warmth}, 0.7)`
                : `rgba(${200 - warmth}, ${220 - warmth}, ${240}, 0.5)`;
          } else {
            ctx.fillStyle = tod === 'night' ? '#0a0a14' : tod === 'dusk' ? '#1a1420' : '#445';
          }
          ctx.fillRect(bx + 4 + fx * 14, by + 4 + fy * floorH, 8, 10);
          winIdx++;
        }
      }
    }

    // ===== TREES =====
    const drawTree = (tx: number, ty: number, size: number) => {
      // Trunk
      ctx.fillStyle = tod === 'night' ? '#2a1a10' : '#5a3a1a';
      ctx.fillRect(tx - 2, ty, 5, size * 0.5);

      // Foliage layers
      const greenBase = tod === 'night' ? [15, 40, 15] : tod === 'dusk' ? [30, 45, 20] : [40, 100, 35];
      for (let layer = 0; layer < 3; layer++) {
        const sway = Math.sin(t * 1.5 + tx * 0.1 + layer) * 2;
        ctx.fillStyle = `rgb(${greenBase[0] + layer * 8}, ${greenBase[1] + layer * 10}, ${greenBase[2] + layer * 5})`;
        ctx.beginPath();
        ctx.arc(tx + sway, ty - layer * size * 0.18, size * (0.35 - layer * 0.06), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawTree(w * 0.05, h * 0.58, 35);
    drawTree(w * 0.22, h * 0.57, 28);
    drawTree(w * 0.78, h * 0.58, 32);
    drawTree(w * 0.95, h * 0.57, 30);

    // ===== STREETLIGHTS =====
    const drawStreetlight = (sx: number) => {
      // Pole
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, h * 0.6);
      ctx.lineTo(sx, h * 0.42);
      ctx.stroke();

      // Arm
      ctx.beginPath();
      ctx.moveTo(sx, h * 0.42);
      ctx.lineTo(sx + 15, h * 0.43);
      ctx.stroke();

      // Light fixture
      ctx.fillStyle = '#333';
      ctx.fillRect(sx + 10, h * 0.43, 12, 4);

      // Light glow (stronger at night)
      if (tod === 'night' || tod === 'dusk') {
        const glowR = tod === 'night' ? 60 : 30;
        const gradient = ctx.createRadialGradient(sx + 16, h * 0.47, 0, sx + 16, h * 0.47, glowR);
        gradient.addColorStop(0, 'rgba(255, 220, 120, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 80, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 200, 80, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(sx + 16 - glowR, h * 0.47 - glowR, glowR * 2, glowR * 2);

        // Light cone on ground
        ctx.fillStyle = 'rgba(255, 220, 120, 0.06)';
        ctx.beginPath();
        ctx.moveTo(sx + 10, h * 0.47);
        ctx.lineTo(sx - 20, h * 0.62);
        ctx.lineTo(sx + 50, h * 0.62);
        ctx.closePath();
        ctx.fill();
      }
    };

    drawStreetlight(w * 0.15);
    drawStreetlight(w * 0.45);
    drawStreetlight(w * 0.72);

    // ===== VEHICLES =====
    // Car 1 - Red sedan moving right
    const car1X = ((t * 65) % (w + 200)) - 100;
    drawCar(ctx, car1X, h * 0.72, '#cc2222', '#88ccff', 45, 18, tod);

    // Car 2 - Blue SUV moving left
    const car2X = w - ((t * 45) % (w + 200)) + 100;
    drawCar(ctx, car2X, h * 0.78, '#2244aa', '#aaddff', 52, 22, tod);

    // Car 3 - Parked white van (left sidewalk)
    drawCar(ctx, w * 0.12, h * 0.73, '#cccccc', '#bbddee', 55, 24, tod);

    // ===== PEOPLE =====
    // Person 1 - walking on left sidewalk
    const p1x = w * 0.28 + Math.sin(t * 1.2) * 8;
    drawPerson(ctx, p1x, h * 0.64, t, 1.2, '#dda0a0', '#4444aa');

    // Person 2 - walking on right sidewalk
    const p2x = w * 0.73 - ((t * 20) % (w * 0.3));
    drawPerson(ctx, p2x, h * 0.65, t, 2.0, '#aaddaa', '#aa4444');

    // Person 3 - jogging
    const p3x = ((t * 50) % (w * 0.4)) + w * 0.28;
    drawPerson(ctx, p3x, h * 0.63, t, 3.5, '#ffcc88', '#333388');

    // Person 4 - standing near building (suspicious loitering)
    drawPerson(ctx, w * 0.88, h * 0.64, t, 0.2, '#888888', '#222222');

    // ===== DOG =====
    const dogX = w * 0.28 + Math.sin(t * 1.2) * 8 + 20;
    const dogY = h * 0.66 + 18;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(dogX, dogY, 12, 6);
    ctx.fillRect(dogX - 3, dogY - 2, 5, 4);
    // Tail
    const tailWag = Math.sin(t * 8) * 3;
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dogX + 12, dogY + 1);
    ctx.lineTo(dogX + 16, dogY - 3 + tailWag);
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(dogX + 2, dogY + 6);
    ctx.lineTo(dogX + 2 + Math.sin(t * 3) * 2, dogY + 11);
    ctx.moveTo(dogX + 10, dogY + 6);
    ctx.lineTo(dogX + 10 - Math.sin(t * 3) * 2, dogY + 11);
    ctx.stroke();

    // ===== BIRDS (daytime only) =====
    if (tod !== 'night') {
      for (const bird of birdsRef.current) {
        const bx2 = ((bird.x + t * bird.speed) % (w + 60)) - 30;
        const by2 = bird.y + Math.sin(t * 2 + bird.wingPhase) * 5;
        const wing = Math.sin(t * 8 + bird.wingPhase) * 6;
        ctx.strokeStyle = tod === 'dusk' ? '#2a1a1a' : '#222';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx2 - 6, by2 + wing);
        ctx.lineTo(bx2, by2);
        ctx.lineTo(bx2 + 6, by2 + wing);
        ctx.stroke();
      }
    }

    // ===== TRAFFIC LIGHT =====
    const tlX = w * 0.62;
    const tlY = h * 0.44;
    ctx.fillStyle = '#333';
    ctx.fillRect(tlX - 1, tlY + 28, 3, h * 0.16);
    ctx.fillRect(tlX - 6, tlY, 14, 28);

    const lightPhase = Math.floor(t / 3) % 3;
    const colors = ['#ff0000', '#ffaa00', '#00cc00'];
    for (let li = 0; li < 3; li++) {
      ctx.fillStyle = li === lightPhase ? colors[li] : '#1a1a1a';
      ctx.beginPath();
      ctx.arc(tlX + 1, tlY + 5 + li * 9, 3, 0, Math.PI * 2);
      ctx.fill();

      if (li === lightPhase) {
        ctx.save();
        ctx.shadowColor = colors[li];
        ctx.shadowBlur = 8;
        ctx.fillStyle = colors[li];
        ctx.beginPath();
        ctx.arc(tlX + 1, tlY + 5 + li * 9, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ===== RAIN =====
    if (weather === 'rain') {
      ctx.strokeStyle = 'rgba(180, 200, 255, 0.4)';
      ctx.lineWidth = 1;
      for (const drop of rainRef.current) {
        const ry = (drop.y + t * drop.speed * 60) % h;
        ctx.beginPath();
        ctx.moveTo(drop.x, ry);
        ctx.lineTo(drop.x - 1, ry + drop.length);
        ctx.stroke();
      }
      // Puddle reflections on road
      ctx.fillStyle = 'rgba(100, 120, 160, 0.15)';
      ctx.fillRect(w * 0.33, h * 0.85, w * 0.34, 3);
      ctx.fillRect(w * 0.36, h * 0.75, w * 0.10, 2);
    }

    // ===== FOG =====
    if (weather === 'fog') {
      const fogGrad = ctx.createLinearGradient(0, h * 0.3, 0, h);
      fogGrad.addColorStop(0, 'rgba(180, 190, 200, 0)');
      fogGrad.addColorStop(0.4, 'rgba(180, 190, 200, 0.3)');
      fogGrad.addColorStop(1, 'rgba(180, 190, 200, 0.6)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // ===== HEADLIGHT BEAMS (night vehicles) =====
    if (tod === 'night') {
      // Car 1 headlights
      const hl1Grad = ctx.createRadialGradient(car1X + 45, h * 0.73, 0, car1X + 45, h * 0.73, 50);
      hl1Grad.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
      hl1Grad.addColorStop(1, 'rgba(255, 255, 200, 0)');
      ctx.fillStyle = hl1Grad;
      ctx.beginPath();
      ctx.moveTo(car1X + 45, h * 0.71);
      ctx.lineTo(car1X + 100, h * 0.68);
      ctx.lineTo(car1X + 100, h * 0.80);
      ctx.lineTo(car1X + 45, h * 0.75);
      ctx.closePath();
      ctx.fill();

      // Car 2 taillights
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(car2X + 52, h * 0.79, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // ===== SECURITY CAMERA OVERLAY =====
    // Corner brackets
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    const bracketSize = 20;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(10, 10 + bracketSize);
    ctx.lineTo(10, 10);
    ctx.lineTo(10 + bracketSize, 10);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - 10 - bracketSize, 10);
    ctx.lineTo(w - 10, 10);
    ctx.lineTo(w - 10, 10 + bracketSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(10, h - 10 - bracketSize);
    ctx.lineTo(10, h - 10);
    ctx.lineTo(10 + bracketSize, h - 10);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - 10 - bracketSize, h - 10);
    ctx.lineTo(w - 10, h - 10);
    ctx.lineTo(w - 10, h - 10 - bracketSize);
    ctx.stroke();

    // Recording indicator
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(5, 5, 260, 36);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`CAM-01  ${camera.resolution || '1080p'}  ${camera.sensorType || 'CMOS'}`, 12, 18);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#aaa';
    const now = new Date();
    ctx.fillText(
      `${now.toLocaleDateString()} ${now.toLocaleTimeString()}.${String(now.getMilliseconds()).padStart(3, '0')}`,
      12, 32
    );

    // REC dot
    if (Math.sin(t * 3) > 0) {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(248, 14, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('REC', 228, 18);
    }

    // ===== AUTO-CYCLE TIME OF DAY (every ~40 seconds) =====
    const cycle = Math.floor(t / 40) % 3;
    const newTod: TimeOfDay = cycle === 0 ? 'night' : cycle === 1 ? 'dusk' : 'day';
    if (timeOfDayRef.current !== newTod) {
      timeOfDayRef.current = newTod;
    }

    // Auto-cycle weather every ~60 seconds
    const wCycle = Math.floor(t / 60) % 4;
    const weathers: WeatherMode[] = ['clear', 'clear', 'cloudy', 'rain'];
    if (weatherRef.current !== weathers[wCycle]) {
      weatherRef.current = weathers[wCycle];
    }

  }, [width, height]);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initScene();

    const animate = () => {
      timeRef.current += 1 / 60;
      drawScene(ctx, timeRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, [width, height, drawScene, initScene]);

  const stop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { canvasRef, start, stop };
}

// ===== HELPER: Draw a car =====
function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  bodyColor: string, windowColor: string,
  carW: number, carH: number,
  tod: TimeOfDay
) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.ellipse(x + carW / 2, y + carH + 3, carW * 0.45, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(x, y, carW, carH, 3);
  ctx.fill();

  // Roof/windows
  ctx.fillStyle = windowColor;
  ctx.beginPath();
  ctx.roundRect(x + carW * 0.2, y - carH * 0.5, carW * 0.55, carH * 0.55, [4, 4, 0, 0]);
  ctx.fill();

  // Window divider
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + carW * 0.45, y - carH * 0.5);
  ctx.lineTo(x + carW * 0.45, y);
  ctx.stroke();

  // Wheels
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(x + carW * 0.22, y + carH, carH * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + carW * 0.78, y + carH, carH * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Wheel rims
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(x + carW * 0.22, y + carH, carH * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + carW * 0.78, y + carH, carH * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Headlights
  ctx.fillStyle = tod === 'night' ? '#ffffcc' : '#ffffffcc';
  ctx.fillRect(x + carW - 3, y + 3, 3, 5);
  ctx.fillRect(x + carW - 3, y + carH - 8, 3, 5);

  // Taillights
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(x, y + 3, 3, 4);
  ctx.fillRect(x, y + carH - 7, 3, 4);
}

// ===== HELPER: Draw a person =====
function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  t: number, walkSpeed: number,
  skinColor: string, shirtColor: string
) {
  const legSwing = Math.sin(t * walkSpeed * 4) * 5;
  const armSwing = Math.sin(t * walkSpeed * 4 + 0.5) * 5;
  const bobble = Math.abs(Math.sin(t * walkSpeed * 4)) * 1.5;

  // Head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(x, y - bobble, 5, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(x, y - bobble - 1, 5, Math.PI, 0);
  ctx.fill();

  // Body
  ctx.strokeStyle = shirtColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 5 - bobble);
  ctx.lineTo(x, y + 18 - bobble);
  ctx.stroke();

  // Arms
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 8 - bobble);
  ctx.lineTo(x - 5 + armSwing, y + 16 - bobble);
  ctx.moveTo(x, y + 8 - bobble);
  ctx.lineTo(x + 5 - armSwing, y + 16 - bobble);
  ctx.stroke();

  // Legs
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 18 - bobble);
  ctx.lineTo(x - 4 + legSwing, y + 30 - bobble);
  ctx.moveTo(x, y + 18 - bobble);
  ctx.lineTo(x + 4 - legSwing, y + 30 - bobble);
  ctx.stroke();

  // Shoes
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(x - 6 + legSwing, y + 29 - bobble, 5, 2);
  ctx.fillRect(x + 2 - legSwing, y + 29 - bobble, 5, 2);
}

// Expose camera config reference for overlay text
const camera = { resolution: '1080p', sensorType: 'CMOS' };
