import { Cpu, Thermometer, HardDrive, Zap, Terminal, Usb, Wifi, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from '../../contexts/CameraContext';
import { SectionHeader } from '../common/SectionHeader';
import type { BoardType } from '../../types/camera';

const BOARDS: {
  type: BoardType;
  name: string;
  desc: string;
  cpu: string;
  ram: string;
  camera: string;
  connectivity: string[];
  pinCount: number;
}[] = [
  {
    type: 'raspberry-pi',
    name: 'Raspberry Pi 4B',
    desc: 'ARM Cortex-A72 Quad-core 1.5GHz',
    cpu: 'BCM2711',
    ram: '4GB LPDDR4',
    camera: 'CSI-2 (IMX219 / IMX477)',
    connectivity: ['WiFi', 'BT', 'ETH', 'USB3'],
    pinCount: 40,
  },
  {
    type: 'esp32',
    name: 'ESP32-CAM',
    desc: 'Xtensa LX6 Dual-core 240MHz',
    cpu: 'ESP32-S',
    ram: '520KB SRAM + 4MB PSRAM',
    camera: 'OV2640 (2MP)',
    connectivity: ['WiFi', 'BT'],
    pinCount: 16,
  },
  {
    type: 'custom',
    name: 'Custom SBC',
    desc: 'User-defined embedded platform',
    cpu: 'Custom ARM/RISC-V',
    ram: 'Configurable',
    camera: 'MIPI CSI / USB',
    connectivity: ['WiFi', 'ETH'],
    pinCount: 26,
  },
];

// Wiring diagram component
function WiringDiagram({ board }: { board: ReturnType<typeof useCamera>['board'] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    // Board rectangle
    const bx = 70;
    const by = 20;
    const bw = 120;
    const bh = 145;
    ctx.fillStyle = '#1a472a';
    ctx.strokeStyle = '#2d8a4e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.stroke();

    // Board label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(board.type === 'raspberry-pi' ? 'RPi 4B' : board.type === 'esp32' ? 'ESP32' : 'SBC', bx + 35, by + 15);

    // CPU chip
    ctx.fillStyle = '#222';
    ctx.fillRect(bx + 40, by + 30, 40, 35);
    ctx.fillStyle = '#555';
    ctx.font = '7px monospace';
    ctx.fillText('CPU', bx + 50, by + 52);

    // Camera connector (CSI)
    ctx.fillStyle = '#444';
    ctx.fillRect(bx + 30, by + 75, 60, 10);
    ctx.fillStyle = '#aaa';
    ctx.font = '6px monospace';
    ctx.fillText('CSI CAM', bx + 38, by + 83);

    // USB ports
    ctx.fillStyle = '#333';
    ctx.fillRect(bx + bw - 5, by + 35, 12, 8);
    ctx.fillRect(bx + bw - 5, by + 48, 12, 8);
    ctx.fillStyle = '#58a6ff';
    ctx.font = '5px monospace';
    ctx.fillText('USB', bx + bw - 2, by + 42);

    // Ethernet
    ctx.fillStyle = '#333';
    ctx.fillRect(bx + bw - 5, by + 62, 14, 12);

    // GPIO pins on left side
    const pinStartY = by + 25;
    const activePinIds = board.pins.filter(p => p.state).map(p => p.id);
    const leftPins = board.pins.slice(0, 4);
    const rightPins = board.pins.slice(4);

    leftPins.forEach((pin, i) => {
      const py = pinStartY + i * 18;
      // Pin dot
      ctx.fillStyle = pin.state ? '#22c55e' : '#666';
      ctx.beginPath();
      ctx.arc(bx - 4, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // Wire to component
      if (pin.state) {
        ctx.strokeStyle = pin.type === 'i2c' ? '#3b82f6' : pin.type === 'pwm' ? '#a78bfa' : '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(bx - 7, py);
        ctx.lineTo(15, py);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Component box
      ctx.fillStyle = pin.state ? 'rgba(34,197,94,0.15)' : 'rgba(100,100,100,0.1)';
      ctx.strokeStyle = pin.state ? '#22c55e55' : '#33333355';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(2, py - 7, 50, 14, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pin.state ? '#22c55e' : '#666';
      ctx.font = '6px monospace';
      ctx.fillText(`${pin.label.slice(0, 8)}`, 5, py + 3);
    });

    rightPins.forEach((pin, i) => {
      const py = pinStartY + i * 18;
      // Pin dot
      ctx.fillStyle = pin.state ? '#22c55e' : '#666';
      ctx.beginPath();
      ctx.arc(bx + bw + 4, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // Wire
      if (pin.state) {
        ctx.strokeStyle = pin.type === 'pwm' ? '#a78bfa' : '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(bx + bw + 7, py);
        ctx.lineTo(w - 55, py);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Component box
      ctx.fillStyle = pin.state ? 'rgba(34,197,94,0.15)' : 'rgba(100,100,100,0.1)';
      ctx.strokeStyle = pin.state ? '#22c55e55' : '#33333355';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(w - 54, py - 7, 52, 14, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pin.state ? '#22c55e' : '#666';
      ctx.font = '6px monospace';
      ctx.fillText(`${pin.label.slice(0, 9)}`, w - 51, py + 3);
    });

    // Camera module above
    ctx.fillStyle = '#1a1a2a';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx + 20, by - 15, 80, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3b82f6';
    ctx.font = '7px monospace';
    ctx.fillText('Camera Module', bx + 28, by - 5);

    // Flat cable from camera to board
    ctx.strokeStyle = '#3b82f655';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx + 60, by - 1);
    ctx.lineTo(bx + 60, by + 75);
    ctx.stroke();

    // Power LED
    const ledOn = activePinIds.length > 0;
    ctx.fillStyle = ledOn ? '#22c55e' : '#333';
    ctx.beginPath();
    ctx.arc(bx + 15, by + bh - 10, 3, 0, Math.PI * 2);
    ctx.fill();
    if (ledOn) {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Legend
    ctx.fillStyle = '#666';
    ctx.font = '6px monospace';
    ctx.fillText('● Active  ○ Inactive', 5, h - 5);
  }, [board]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={185}
      style={{
        width: '100%', height: 140, borderRadius: 6,
        border: '1px solid var(--border-color)',
      }}
    />
  );
}

// Serial Console
function SerialConsole({ board }: { board: ReturnType<typeof useCamera>['board'] }) {
  const [lines, setLines] = useState<string[]>([
    '[0.000] Booting embedded Linux kernel...',
    '[0.120] CPU: ARM Cortex-A72 @ 1.5GHz',
    '[0.250] RAM: 4096MB detected',
    '[0.400] Loading device tree...',
    '[0.800] CSI camera module detected',
    '[1.200] Initializing V4L2 driver...',
    '[1.500] Camera: IMX219 1920x1080 @ 30fps',
    '[2.000] Network: wlan0 UP 192.168.1.100',
    '[2.500] System ready.',
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Add log lines for pin changes
  useEffect(() => {
    const activePins = board.pins.filter(p => p.state);
    if (activePins.length > 0) {
      const latest = activePins[activePins.length - 1];
      setLines(prev => [...prev, `[${(Date.now() % 100000 / 1000).toFixed(3)}] GPIO${latest.id}: ${latest.label} → HIGH`]);
    }
  }, [board.pins]);

  const handleCommand = () => {
    if (!input.trim()) return;
    setLines(prev => [...prev, `$ ${input}`]);

    const cmd = input.trim().toLowerCase();
    const responses: Record<string, string[]> = {
      'ls': ['camera.py  config.json  stream.sh  detect.py  logs/'],
      'gpio readall': board.pins.map(p => `  GPIO${p.id}: ${p.label} [${p.mode}] = ${p.state ? 'HIGH' : 'LOW'}`),
      'vcgencmd measure_temp': [`temp=${board.temperature}.0'C`],
      'raspistill -o test.jpg': ['[cam] Capturing still image...', '[cam] Saved: test.jpg (1920x1080)'],
      'v4l2-ctl --list-devices': ['/dev/video0: imx219 (CSI-2)', '/dev/video1: USB Camera (UVC)'],
      'free -h': [`Mem: ${board.memoryUsage}% used  Swap: 0%`],
      'top': [`CPU: ${board.cpuUsage}%  MEM: ${board.memoryUsage}%  TEMP: ${board.temperature}°C`],
      'ifconfig': ['wlan0: 192.168.1.100  UP RUNNING', 'eth0: 192.168.1.101  UP RUNNING'],
      'cat /proc/cpuinfo': ['Hardware: BCM2711', 'Model: Raspberry Pi 4 Model B Rev 1.4'],
      'help': ['Available commands: ls, gpio readall, vcgencmd measure_temp,', 'raspistill, v4l2-ctl, free, top, ifconfig, cat /proc/cpuinfo, clear'],
      'clear': [],
    };

    if (cmd === 'clear') {
      setLines([]);
    } else {
      const resp = responses[cmd] || [`bash: ${input}: command not found`];
      setLines(prev => [...prev, ...resp]);
    }

    setInput('');
  };

  return (
    <div style={{
      borderRadius: 8, overflow: 'hidden',
      border: '1px solid var(--border-color)',
      marginBottom: 14,
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '6px 10px', fontSize: 11,
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Terminal size={12} />
          Serial Console ({board.name})
        </span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </div>

      {expanded && (
        <>
          <div
            ref={scrollRef}
            style={{
              padding: 8, background: '#0d1117',
              fontFamily: 'monospace', fontSize: 10,
              height: 160, overflowY: 'auto',
              color: '#8b949e',
            }}
          >
            {lines.map((line, i) => (
              <div key={i} style={{
                color: line.startsWith('$') ? '#58a6ff'
                  : line.startsWith('[') ? '#8b949e'
                    : line.includes('error') ? '#f85149'
                      : '#c9d1d9',
                marginBottom: 1,
              }}>
                {line}
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex', borderTop: '1px solid #1a1d27',
            background: '#0d1117',
          }}>
            <span style={{ padding: '4px 6px', color: '#58a6ff', fontSize: 11, fontFamily: 'monospace' }}>$</span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCommand()}
              placeholder="Type command..."
              style={{
                flex: 1, padding: '4px 6px', border: 'none',
                background: 'transparent', color: '#c9d1d9',
                fontFamily: 'monospace', fontSize: 11, outline: 'none',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function EmbeddedPanel() {
  const { board, setBoard } = useCamera();
  const [showWiring, setShowWiring] = useState(true);

  // Simulate CPU/memory fluctuation
  useEffect(() => {
    const id = setInterval(() => {
      setBoard(prev => ({
        ...prev,
        cpuUsage: Math.min(95, Math.max(15, prev.cpuUsage + (Math.random() - 0.5) * 8)),
        memoryUsage: Math.min(90, Math.max(20, prev.memoryUsage + (Math.random() - 0.5) * 3)),
        temperature: Math.min(80, Math.max(35, prev.temperature + (Math.random() - 0.5) * 2)),
      }));
    }, 2000);
    return () => clearInterval(id);
  }, [setBoard]);

  const currentBoard = BOARDS.find(b => b.type === board.type) || BOARDS[0];

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SectionHeader
        icon={<Cpu size={18} color="var(--accent)" />}
        title="Embedded System"
        subtitle="Board, GPIO & hardware integration"
      />

      {/* Board Selection */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Target Board
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {BOARDS.map(b => (
            <button
              key={b.type}
              onClick={() => setBoard(prev => ({ ...prev, type: b.type, name: b.name }))}
              style={{
                padding: 10, borderRadius: 8, textAlign: 'left',
                border: `1.5px solid ${board.type === b.type ? 'var(--accent)' : 'var(--border-color)'}`,
                background: board.type === b.type ? 'rgba(59,130,246,0.08)' : 'var(--bg-tertiary)',
                cursor: 'pointer', color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{b.name}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {b.connectivity.map(c => (
                    <span key={c} style={{
                      fontSize: 8, padding: '1px 4px', borderRadius: 3,
                      background: 'rgba(59,130,246,0.1)', color: 'var(--accent)',
                    }}>{c}</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{b.desc}</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1, fontFamily: 'monospace' }}>
                {b.cpu} | {b.ram} | {b.camera}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* System Monitor */}
      <div style={{
        marginBottom: 14, padding: 10, borderRadius: 8,
        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          System Monitor
          <span style={{
            fontSize: 8, padding: '1px 5px', borderRadius: 4,
            background: 'rgba(34,197,94,0.1)', color: 'var(--success)',
            marginLeft: 'auto',
          }}>LIVE</span>
        </div>
        {[
          {
            icon: <Cpu size={11} />, label: 'CPU',
            value: Math.round(board.cpuUsage), unit: '%',
            color: board.cpuUsage > 80 ? 'var(--danger)' : board.cpuUsage > 60 ? 'var(--warning)' : 'var(--success)',
          },
          {
            icon: <HardDrive size={11} />, label: 'Memory',
            value: Math.round(board.memoryUsage), unit: '%',
            color: board.memoryUsage > 80 ? 'var(--danger)' : 'var(--accent)',
          },
          {
            icon: <Thermometer size={11} />, label: 'Temperature',
            value: Math.round(board.temperature), unit: '°C',
            color: board.temperature > 70 ? 'var(--danger)' : board.temperature > 55 ? 'var(--warning)' : 'var(--success)',
          },
        ].map(stat => (
          <div key={stat.label} style={{ marginBottom: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 10, marginBottom: 3,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                {stat.icon} {stat.label}
              </span>
              <span style={{ fontFamily: 'monospace', color: stat.color, fontWeight: 600 }}>
                {stat.value}{stat.unit}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-primary)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, background: stat.color,
                width: `${Math.min(100, stat.value)}%`, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        ))}

        {/* Connection info */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 8, paddingTop: 8,
          borderTop: '1px solid var(--border-color)',
        }}>
          {[
            { icon: <Usb size={10} />, label: 'Camera', connected: board.cameraConnected },
            { icon: <Wifi size={10} />, label: 'WiFi', connected: true },
          ].map(conn => (
            <div key={conn.label} style={{
              flex: 1, padding: '4px 6px', borderRadius: 4,
              background: conn.connected ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              fontSize: 9, display: 'flex', alignItems: 'center', gap: 3,
              color: conn.connected ? 'var(--success)' : 'var(--danger)',
            }}>
              {conn.icon}
              {conn.label}: {conn.connected ? 'Connected' : 'Disconnected'}
            </div>
          ))}
        </div>
      </div>

      {/* Wiring Diagram */}
      <div style={{ marginBottom: 14 }}>
        <div
          onClick={() => setShowWiring(!showWiring)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={11} color="var(--warning)" />
            Wiring Diagram
          </span>
          {showWiring ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
        {showWiring && <WiringDiagram board={board} />}
      </div>

      {/* Serial Console */}
      <SerialConsole board={board} />

      {/* GPIO Pins */}
      <div style={{
        padding: 10, borderRadius: 8,
        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Zap size={12} color="var(--warning)" />
          GPIO Pins
          <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-secondary)' }}>
            {board.pins.filter(p => p.state).length}/{board.pins.length} active
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {board.pins.map(pin => (
            <button
              key={pin.id}
              onClick={() => {
                setBoard(prev => ({
                  ...prev,
                  pins: prev.pins.map(p => p.id === pin.id ? { ...p, state: !p.state } : p),
                }));
              }}
              style={{
                padding: '6px 8px', borderRadius: 6, textAlign: 'left',
                border: `1px solid ${pin.state ? 'var(--success)' : 'var(--border-color)'}`,
                background: pin.state ? 'rgba(34,197,94,0.08)' : 'transparent',
                cursor: 'pointer', color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: pin.state ? 'var(--success)' : 'var(--border-color)',
                  boxShadow: pin.state ? '0 0 4px var(--success)' : 'none',
                }} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>GPIO {pin.id}</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>{pin.label}</div>
              <div style={{
                display: 'flex', gap: 4, marginTop: 2,
              }}>
                <span style={{
                  fontSize: 8, padding: '0px 4px', borderRadius: 3,
                  background: pin.type === 'pwm' ? 'rgba(167,139,250,0.15)' : pin.type === 'i2c' ? 'rgba(59,130,246,0.15)' : 'rgba(100,100,100,0.15)',
                  color: pin.type === 'pwm' ? '#a78bfa' : pin.type === 'i2c' ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                  {pin.type.toUpperCase()}
                </span>
                <span style={{
                  fontSize: 8, color: pin.state ? 'var(--success)' : 'var(--text-secondary)',
                  fontFamily: 'monospace',
                }}>
                  {pin.state ? 'HIGH' : 'LOW'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
