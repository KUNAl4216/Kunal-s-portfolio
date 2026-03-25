interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderControl({ label, value, min, max, step = 1, unit = '', onChange }: SliderControlProps) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, marginBottom: 4,
        color: 'var(--text-secondary)',
      }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}
