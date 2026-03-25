import { useState } from 'react';
import { CameraProvider } from './contexts/CameraContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CameraViewport } from './components/preview/CameraViewport';
import { PipelineFlow } from './components/pipeline/PipelineFlow';
import { CameraPanel } from './components/camera/CameraPanel';
import { PipelinePanel } from './components/pipeline/PipelinePanel';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { DetectionPanel } from './components/detection/DetectionPanel';
import { EmbeddedPanel } from './components/embedded/EmbeddedPanel';
import { NetworkPanel } from './components/network/NetworkPanel';
import { DeveloperPanel } from './components/developer/DeveloperPanel';
import { EventsPanel } from './components/events/EventsPanel';
import { ThreePanel } from './components/three/ThreePanel';

function AppContent() {
  const [activeTab, setActiveTab] = useState('3d');

  const renderPanel = () => {
    switch (activeTab) {
      case 'camera': return <CameraPanel />;
      case 'pipeline': return <PipelinePanel />;
      case 'preview': return <PreviewPanel />;
      case 'detection': return <DetectionPanel />;
      case 'embedded': return <EmbeddedPanel />;
      case 'network': return <NetworkPanel />;
      case 'developer': return <DeveloperPanel />;
      case 'events': return <EventsPanel />;
      case '3d': return null;
      default: return <CameraPanel />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Main viewport */}
          {activeTab === '3d' ? (
            <ThreePanel />
          ) : (
            <>
              <CameraViewport />

              {/* Right panel */}
              <div style={{
                width: 320,
                minWidth: 320,
                background: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}>
                {renderPanel()}
              </div>
            </>
          )}
        </div>

        <PipelineFlow />
      </div>
    </div>
  );
}

function App() {
  return (
    <CameraProvider>
      <AppContent />
    </CameraProvider>
  );
}

export default App;
