import type { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 16, paddingBottom: 10,
      borderBottom: '1px solid var(--border-color)',
    }}>
      {icon}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
