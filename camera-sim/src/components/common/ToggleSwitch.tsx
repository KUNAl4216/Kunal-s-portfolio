interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: 'pointer', padding: '6px 0',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: checked ? 'var(--accent)' : 'var(--border-color)',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', position: 'absolute',
          top: 2, left: checked ? 18 : 2,
          transition: 'left 0.2s',
        }} />
      </div>
    </label>
  );
}
