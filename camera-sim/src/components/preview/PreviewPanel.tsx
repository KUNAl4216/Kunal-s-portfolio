import { Eye } from 'lucide-react';
import { useCamera } from '../../contexts/CameraContext';
import { SectionHeader } from '../common/SectionHeader';
import type { PreviewMode } from '../../types/camera';

export function PreviewPanel() {
  const { previewMode, setPreviewMode } = useCamera();

  const modes: { id: PreviewMode; label: string; desc: string; color: string }[] = [
    { id: 'raw', label: 'Raw Sensor', desc: 'Scene + Lens + Sensor only', color: 'var(--pipeline-sensor)' },
    { id: 'processed', label: 'ISP Processed', desc: 'Full ISP pipeline applied', color: 'var(--pipeline-isp)' },
    { id: 'encoded', label: 'Encoded Stream', desc: 'After encoder compression', color: 'var(--pipeline-encoder)' },
  ];

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SectionHeader
        icon={<Eye size={18} color="var(--accent)" />}
        title="Preview Mode"
        subtitle="Switch between pipeline stages"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => setPreviewMode(mode.id)}
            style={{
              padding: 12, borderRadius: 8, textAlign: 'left',
              border: `1px solid ${previewMode === mode.id ? mode.color : 'var(--border-color)'}`,
              background: previewMode === mode.id ? `${mode.color}15` : 'var(--bg-tertiary)',
              cursor: 'pointer', color: 'var(--text-primary)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: previewMode === mode.id ? mode.color : 'var(--text-primary)' }}>
              {mode.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{mode.desc}</div>
          </button>
        ))}
      </div>

      {/* Pipeline stage indicator */}
      <div style={{
        marginTop: 20, padding: 12, borderRadius: 8,
        background: 'var(--bg-tertiary)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Active Pipeline Stages</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['Scene', 'Lens', 'Sensor', 'ISP', 'Encoder'].map((stage, i) => {
            const isActive = previewMode === 'raw' ? i <= 2 :
              previewMode === 'processed' ? i <= 3 : true;
            const colors = ['var(--pipeline-scene)', 'var(--pipeline-lens)', 'var(--pipeline-sensor)', 'var(--pipeline-isp)', 'var(--pipeline-encoder)'];
            return (
              <div key={stage} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 8px', borderRadius: 4,
                opacity: isActive ? 1 : 0.3,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isActive ? colors[i] : 'var(--border-color)',
                }} />
                <span style={{ fontSize: 11 }}>{stage}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-secondary)' }}>
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
