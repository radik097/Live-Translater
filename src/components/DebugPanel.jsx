import { useState } from 'react';

export default function DebugPanel({
  sttStatus,
  ttsQueueLength,
  lastPartial,
  lastCommitted,
  lastTranslation,
  latencyMs,
  errors = [],
  visible,
}) {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  return (
    <div className="debug-panel">
      <button
        className="debug-panel__toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        🐛 Debug {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div className="debug-panel__content">
          <div className="debug-panel__row">
            <span className="debug-panel__key">STT Status:</span>
            <span className="debug-panel__value">{sttStatus || 'idle'}</span>
          </div>
          <div className="debug-panel__row">
            <span className="debug-panel__key">TTS Queue:</span>
            <span className="debug-panel__value">{ttsQueueLength ?? 0}</span>
          </div>
          <div className="debug-panel__row">
            <span className="debug-panel__key">Latency:</span>
            <span className="debug-panel__value">
              {latencyMs != null ? `${latencyMs}ms` : 'N/A'}
            </span>
          </div>
          <div className="debug-panel__row">
            <span className="debug-panel__key">Partial:</span>
            <span className="debug-panel__value debug-panel__value--mono">
              {lastPartial || '—'}
            </span>
          </div>
          <div className="debug-panel__row">
            <span className="debug-panel__key">Committed:</span>
            <span className="debug-panel__value debug-panel__value--mono">
              {lastCommitted || '—'}
            </span>
          </div>
          <div className="debug-panel__row">
            <span className="debug-panel__key">Translation:</span>
            <span className="debug-panel__value debug-panel__value--mono">
              {lastTranslation || '—'}
            </span>
          </div>
          {errors.length > 0 && (
            <div className="debug-panel__errors">
              <span className="debug-panel__key">Errors:</span>
              {errors.map((e, i) => (
                <div key={i} className="debug-panel__error">
                  {e}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
