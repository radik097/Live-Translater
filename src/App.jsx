import { useState, useCallback } from 'react';
import ListenMode from './modes/ListenMode.jsx';
import DialogueMode from './modes/DialogueMode.jsx';
import DebugPanel from './components/DebugPanel.jsx';
import { saveSettings, loadSettings } from './storage/settingsStore.js';
import './App.css';

const MODES = [
  { id: 'listen', label: '🎙 Listen' },
  { id: 'dialogue', label: '💬 Dialogue' },
];

function App() {
  const saved = loadSettings() || {};
  const [mode, setMode] = useState(saved.appMode || 'listen');
  const [showDebug, setShowDebug] = useState(false);
  const [debugState, setDebugState] = useState({});

  const handleModeChange = (newMode) => {
    setMode(newMode);
    saveSettings({ ...loadSettings(), appMode: newMode });
  };

  const handleDebugUpdate = useCallback((updates) => {
    setDebugState((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__icon">🌐</span>
          <h1 className="app-header__title">Live Translater</h1>
        </div>
        <div className="app-header__actions">
          <button
            className={`btn btn--ghost ${showDebug ? 'btn--active' : ''}`}
            onClick={() => setShowDebug((v) => !v)}
            title="Toggle debug panel"
          >
            🐛
          </button>
        </div>
      </header>

      <nav className="mode-tabs">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-tab ${mode === m.id ? 'mode-tab--active' : ''}`}
            onClick={() => handleModeChange(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {mode === 'listen' && (
          <ListenMode onDebugUpdate={handleDebugUpdate} />
        )}
        {mode === 'dialogue' && (
          <DialogueMode onDebugUpdate={handleDebugUpdate} />
        )}
      </main>

      <DebugPanel
        visible={showDebug}
        sttStatus={debugState.sttStatus}
        ttsQueueLength={debugState.ttsQueueLength}
        lastPartial={debugState.lastPartial}
        lastCommitted={debugState.lastCommitted}
        lastTranslation={debugState.lastTranslation}
        latencyMs={debugState.latencyMs}
        errors={debugState.error ? [debugState.error] : []}
      />

      <footer className="app-footer">
        <span>Live Translater — powered by ElevenLabs &amp; OpenRouter</span>
      </footer>
    </div>
  );
}

export default App;
