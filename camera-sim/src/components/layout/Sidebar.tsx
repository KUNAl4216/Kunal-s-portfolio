import { Camera, Settings, Eye, Cpu, Wifi, Code, Activity, AlertTriangle, Box, ChevronLeft, ChevronRight, Aperture } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: '3d', icon: Box, label: '3D Engine' },
  { id: 'camera', icon: Camera, label: 'Camera' },
  { id: 'pipeline', icon: Settings, label: 'Pipeline' },
  { id: 'preview', icon: Eye, label: 'Preview' },
  { id: 'detection', icon: Activity, label: 'Detection' },
  { id: 'embedded', icon: Cpu, label: 'Embedded' },
  { id: 'network', icon: Wifi, label: 'Network' },
  { id: 'developer', icon: Code, label: 'Developer' },
  { id: 'events', icon: AlertTriangle, label: 'Events' },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        width: collapsed ? 52 : 210,
        minWidth: collapsed ? 52 : 210,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s, min-width 0.2s',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: collapsed ? '12px 8px' : '14px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Aperture size={18} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.5))' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.5px' }}>
                cam::core<span style={{ color: 'var(--cpp-orange)' }}>++</span>
              </div>
              <div style={{ fontSize: 8, color: 'var(--text-secondary)', letterSpacing: '1px', marginTop: 1 }}>
                3D CAMERA ENGINE
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '6px 0', overflowY: 'auto' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const is3D = tab.id === '3d';
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '9px 0' : '9px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive
                  ? is3D ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 212, 255, 0.06)'
                  : 'transparent',
                border: 'none',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(0,212,255,0.04)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={16} />
              {!collapsed && <span>{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-color)',
          fontSize: 9,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#2a3a55',
        }}>
          <div style={{ color: '#1a5a3a' }}>// v2.0 — C++ powered</div>
          <div style={{ color: '#3a4a6a', marginTop: 2 }}>#include &lt;cam/core.hpp&gt;</div>
        </div>
      )}
      {collapsed && (
        <div style={{
          padding: '8px',
          borderTop: '1px solid var(--border-color)',
          fontSize: 9,
          color: 'var(--accent)',
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          ++
        </div>
      )}
    </div>
  );
}
