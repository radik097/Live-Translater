export default function LiveTranscript({ partialText, entries = [], direction }) {
  return (
    <div className="live-transcript">
      <div className="live-transcript__header">
        <span className="live-transcript__title">
          {direction ? `Transcript (${direction})` : 'Transcript'}
        </span>
        <span className="live-transcript__count">{entries.length} entries</span>
      </div>

      <div className="live-transcript__body">
        {partialText && (
          <div className="live-transcript__partial">
            <span className="live-transcript__partial-indicator">●</span>
            {partialText}
          </div>
        )}

        <div className="live-transcript__entries">
          {entries.length === 0 && !partialText && (
            <div className="live-transcript__empty">No transcript yet. Start speaking...</div>
          )}
          {[...entries].reverse().map((entry, i) => (
            <div key={`${entry.ts}-${i}`} className="live-transcript__entry">
              <div className="live-transcript__entry-time">
                {new Date(entry.ts).toLocaleTimeString()}
              </div>
              <div className="live-transcript__entry-original">{entry.original}</div>
              <div className="live-transcript__entry-arrow">→</div>
              <div className="live-transcript__entry-translated">{entry.translated}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
