import React from 'react';
import { createRoot } from 'react-dom/client';
import { Chat } from './modules/Chat';

const App: React.FC = () => {
  return (
    <div style={{ fontFamily: 'system-ui', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Personal AI Workspace OS</h3>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Local MCP Dashboard (Prototype)</span>
      </header>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 2, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
          <Chat />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 600 }}>Panels (Coming Soon)</div>
          <div style={{ padding: 12, fontSize: 14, opacity: 0.7 }}>
            File system, Notes, Tasks, Email integrations will appear here.
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
