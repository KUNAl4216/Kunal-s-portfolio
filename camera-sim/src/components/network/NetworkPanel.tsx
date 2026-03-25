import { Wifi, Globe, Clock, AlertCircle } from 'lucide-react';
import { useCamera } from '../../contexts/CameraContext';
import { SectionHeader } from '../common/SectionHeader';
import { SliderControl } from '../common/SliderControl';
import { ToggleSwitch } from '../common/ToggleSwitch';
import type { StreamProtocol } from '../../types/camera';

export function NetworkPanel() {
  const { stream, setStream, isStreaming, encoder, camera } = useCamera();

  const estimatedBandwidth = encoder.bitrate * 1.1;
  const effectiveLatency = stream.latency + (stream.jitter > 0 ? Math.random() * stream.jitter : 0);

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SectionHeader
        icon={<Wifi size={18} color="var(--accent)" />}
        title="Network Simulation"
        subtitle="RTSP, HTTP, latency & packet simulation"
      />

      {/* Stream Status */}
      <div style={{
        padding: 12, borderRadius: 8, marginBottom: 16,
        background: isStreaming ? 'rgba(34,197,94,0.1)' : 'var(--bg-tertiary)',
        border: `1px solid ${isStreaming ? 'var(--success)' : 'var(--border-color)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isStreaming ? 'var(--success)' : 'var(--border-color)',
          }} />
          <span style={{ fontWeight: 600, color: isStreaming ? 'var(--success)' : 'var(--text-secondary)' }}>
            {isStreaming ? 'Stream Active' : 'Stream Inactive'}
          </span>
        </div>
        {isStreaming && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
            <div>{stream.protocol}://192.168.1.100:{stream.port}/live</div>
            <div>Bandwidth: ~{(estimatedBandwidth / 1000).toFixed(1)} Mbps</div>
          </div>
        )}
      </div>

      {/* Protocol Selection */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Stream Protocol
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['RTSP', 'WebRTC', 'HTTP'] as StreamProtocol[]).map(proto => (
            <button
              key={proto}
              onClick={() => setStream(p => ({
                ...p,
                protocol: proto,
                port: proto === 'RTSP' ? 554 : proto === 'WebRTC' ? 8443 : 8080,
              }))}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11,
                border: `1px solid ${stream.protocol === proto ? 'var(--accent)' : 'var(--border-color)'}`,
                background: stream.protocol === proto ? 'rgba(59,130,246,0.15)' : 'var(--bg-tertiary)',
                color: stream.protocol === proto ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {proto}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Port</label>
        <input
          type="number"
          value={stream.port}
          onChange={e => setStream(p => ({ ...p, port: Number(e.target.value) }))}
          style={{
            width: '100%', padding: '6px 10px', borderRadius: 6,
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      <ToggleSwitch label="Enable Stream" checked={stream.enabled} onChange={v => setStream(p => ({ ...p, enabled: v }))} />

      {/* Network Conditions */}
      <div style={{
        marginTop: 16, padding: 12, borderRadius: 8,
        background: 'var(--bg-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
          <Clock size={14} />
          Network Conditions
        </div>
        <SliderControl label="Latency" value={stream.latency} min={0} max={500} unit="ms" onChange={v => setStream(p => ({ ...p, latency: v }))} />
        <SliderControl label="Packet Loss" value={stream.packetLoss} min={0} max={50} unit="%" onChange={v => setStream(p => ({ ...p, packetLoss: v }))} />
        <SliderControl label="Jitter" value={stream.jitter} min={0} max={100} unit="ms" onChange={v => setStream(p => ({ ...p, jitter: v }))} />
      </div>

      {/* HTTP Snapshot API */}
      <div style={{
        marginTop: 16, padding: 12, borderRadius: 8,
        background: 'var(--bg-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
          <Globe size={14} />
          HTTP Snapshot API
        </div>
        <div style={{
          padding: 8, borderRadius: 4, fontFamily: 'monospace', fontSize: 11,
          background: 'var(--bg-primary)', color: 'var(--text-secondary)',
          wordBreak: 'break-all',
        }}>
          <div>GET /api/snapshot</div>
          <div>GET /api/stream/status</div>
          <div>POST /api/camera/config</div>
          <div>GET /api/events</div>
        </div>
        <div style={{
          marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, color: 'var(--text-secondary)',
        }}>
          <AlertCircle size={10} />
          Simulated endpoints — no real server
        </div>
      </div>

      {/* Stats */}
      <div style={{
        marginTop: 16, padding: 12, borderRadius: 8,
        background: 'var(--bg-tertiary)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Stream Statistics</div>
        <div style={{ fontSize: 11 }}>
          {[
            { label: 'Resolution', value: camera.resolution },
            { label: 'FPS', value: `${camera.fps}` },
            { label: 'Codec', value: encoder.codec },
            { label: 'Bitrate', value: `${encoder.bitrate} kbps` },
            { label: 'Eff. Latency', value: `${effectiveLatency.toFixed(0)}ms` },
            { label: 'Packet Loss', value: `${stream.packetLoss}%` },
          ].map(stat => (
            <div key={stat.label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '3px 0', color: 'var(--text-secondary)',
            }}>
              <span>{stat.label}</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
