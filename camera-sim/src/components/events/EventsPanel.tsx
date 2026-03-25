import { AlertTriangle, Trash2, Download } from 'lucide-react';
import { useCamera } from '../../contexts/CameraContext';
import { SectionHeader } from '../common/SectionHeader';

const severityColors = {
  info: 'var(--accent)',
  warning: 'var(--warning)',
  error: 'var(--danger)',
};

const typeIcons: Record<string, string> = {
  motion: 'M',
  object: 'O',
  face: 'F',
  gpio: 'G',
  stream: 'S',
  system: 'SYS',
};

export function EventsPanel() {
  const { events, clearEvents } = useCamera();

  const exportEvents = () => {
    const data = JSON.stringify(events.map(e => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    })), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `camera-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <SectionHeader
        icon={<AlertTriangle size={18} color="var(--accent)" />}
        title="Event Log"
        subtitle={`${events.length} events recorded`}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={clearEvents}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 6, fontSize: 11,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={12} /> Clear All
        </button>
        <button
          onClick={exportEvents}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 6, fontSize: 11,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Download size={12} /> Export
        </button>
      </div>

      {events.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 40,
          color: 'var(--text-secondary)', fontSize: 12,
        }}>
          No events yet. Enable motion detection or interact with GPIO pins to generate events.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.map(event => (
            <div key={event.id} style={{
              padding: '8px 10px', borderRadius: 6,
              background: 'var(--bg-tertiary)',
              borderLeft: `3px solid ${severityColors[event.severity]}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 9, padding: '1px 4px', borderRadius: 3,
                  background: `${severityColors[event.severity]}22`,
                  color: severityColors[event.severity],
                  fontWeight: 600,
                }}>
                  {typeIcons[event.type] || event.type}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                {event.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
