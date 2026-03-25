import { Settings, ArrowRight } from 'lucide-react';
import { useCamera } from '../../contexts/CameraContext';
import { SectionHeader } from '../common/SectionHeader';
import { SliderControl } from '../common/SliderControl';
import { ToggleSwitch } from '../common/ToggleSwitch';
import type { EncoderType, ISPConfig } from '../../types/camera';

export function PipelinePanel() {
  const { lens, setLens, isp, setIsp, encoder, setEncoder, pipelineStages } = useCamera();

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SectionHeader
        icon={<Settings size={18} color="var(--accent)" />}
        title="Camera Pipeline"
        subtitle="Scene → Lens → Sensor → ISP → Encoder → Stream"
      />

      {/* Pipeline Flow Visualization */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        marginBottom: 20, padding: 10, borderRadius: 8,
        background: 'var(--bg-tertiary)', overflowX: 'auto',
      }}>
        {pipelineStages.map((stage, i) => (
          <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
              background: `${stage.color}22`, color: stage.color,
              border: `1px solid ${stage.color}44`,
              whiteSpace: 'nowrap',
            }}>
              {stage.name}
              <div style={{ fontSize: 9, opacity: 0.7 }}>{stage.latencyMs}ms</div>
            </div>
            {i < pipelineStages.length - 1 && (
              <ArrowRight size={12} color="var(--text-secondary)" />
            )}
          </div>
        ))}
      </div>

      {/* Lens Controls */}
      <div style={{
        marginBottom: 16, padding: 12, borderRadius: 8,
        border: '1px solid var(--pipeline-lens)', background: 'rgba(6,182,212,0.05)',
      }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--pipeline-lens)', marginBottom: 10 }}>
          Lens Module
        </h4>
        <SliderControl label="Focal Length" value={lens.focalLength} min={1} max={50} step={0.5} unit="mm" onChange={v => setLens(p => ({ ...p, focalLength: v }))} />
        <SliderControl label="Aperture" value={lens.aperture} min={0.8} max={16} step={0.1} unit="" onChange={v => setLens(p => ({ ...p, aperture: v }))} />
        <SliderControl label="Blur" value={lens.blur} min={0} max={100} onChange={v => setLens(p => ({ ...p, blur: v }))} />
        <SliderControl label="Distortion" value={lens.distortion} min={-50} max={50} onChange={v => setLens(p => ({ ...p, distortion: v }))} />
        <SliderControl label="Focus Distance" value={lens.focusDistance} min={0} max={100} unit="%" onChange={v => setLens(p => ({ ...p, focusDistance: v }))} />
      </div>

      {/* ISP Controls */}
      <div style={{
        marginBottom: 16, padding: 12, borderRadius: 8,
        border: '1px solid var(--pipeline-isp)', background: 'rgba(16,185,129,0.05)',
      }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--pipeline-isp)', marginBottom: 10 }}>
          ISP (Image Signal Processor)
        </h4>
        <SliderControl label="White Balance" value={isp.whiteBalance} min={2500} max={10000} step={100} unit="K" onChange={v => setIsp(p => ({ ...p, whiteBalance: v }))} />
        <ToggleSwitch label="Auto Exposure" checked={isp.autoExposure} onChange={v => setIsp(p => ({ ...p, autoExposure: v }))} />
        <SliderControl label="Exposure Comp" value={isp.exposureCompensation} min={-3} max={3} step={0.1} unit="EV" onChange={v => setIsp(p => ({ ...p, exposureCompensation: v }))} />
        <SliderControl label="Gamma" value={isp.gamma} min={0.1} max={3} step={0.05} onChange={v => setIsp(p => ({ ...p, gamma: v }))} />
        <SliderControl label="Denoise" value={isp.denoise} min={0} max={100} onChange={v => setIsp(p => ({ ...p, denoise: v }))} />

        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Color Mode</label>
          <select
            value={isp.colorMode}
            onChange={e => setIsp(p => ({ ...p, colorMode: e.target.value as ISPConfig['colorMode'] }))}
          >
            <option value="normal">Normal</option>
            <option value="vivid">Vivid</option>
            <option value="monochrome">Monochrome</option>
            <option value="sepia">Sepia</option>
          </select>
        </div>
      </div>

      {/* Encoder Controls */}
      <div style={{
        padding: 12, borderRadius: 8,
        border: '1px solid var(--pipeline-encoder)', background: 'rgba(236,72,153,0.05)',
      }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--pipeline-encoder)', marginBottom: 10 }}>
          Encoder
        </h4>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Codec</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['H264', 'H265', 'MJPEG'] as EncoderType[]).map(codec => (
              <button
                key={codec}
                onClick={() => setEncoder(p => ({ ...p, codec }))}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 11,
                  border: `1px solid ${encoder.codec === codec ? 'var(--pipeline-encoder)' : 'var(--border-color)'}`,
                  background: encoder.codec === codec ? 'rgba(236,72,153,0.15)' : 'var(--bg-tertiary)',
                  color: encoder.codec === codec ? 'var(--pipeline-encoder)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {codec}
              </button>
            ))}
          </div>
        </div>
        <SliderControl label="Bitrate" value={encoder.bitrate} min={500} max={20000} step={500} unit="kbps" onChange={v => setEncoder(p => ({ ...p, bitrate: v }))} />
        <SliderControl label="Quality" value={encoder.quality} min={10} max={100} onChange={v => setEncoder(p => ({ ...p, quality: v }))} />
        <SliderControl label="Keyframe Interval" value={encoder.keyframeInterval} min={1} max={120} unit=" frames" onChange={v => setEncoder(p => ({ ...p, keyframeInterval: v }))} />

        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Rate Control</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['CBR', 'VBR'] as const).map(rc => (
              <button
                key={rc}
                onClick={() => setEncoder(p => ({ ...p, rateControl: rc }))}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 11,
                  border: `1px solid ${encoder.rateControl === rc ? 'var(--pipeline-encoder)' : 'var(--border-color)'}`,
                  background: encoder.rateControl === rc ? 'rgba(236,72,153,0.15)' : 'var(--bg-tertiary)',
                  color: encoder.rateControl === rc ? 'var(--pipeline-encoder)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {rc}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
