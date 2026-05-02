import { exportAsJsonl, exportAsMarkdown, downloadFile } from '../storage/exportTranscript.js';

export default function ExportPanel({ entries = [], onClear }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  function handleExportJsonl() {
    const content = exportAsJsonl(entries);
    downloadFile(content, `transcript-${timestamp}.jsonl`, 'application/x-ndjson');
  }

  function handleExportMarkdown() {
    const content = exportAsMarkdown(entries);
    downloadFile(content, `transcript-${timestamp}.md`, 'text/markdown');
  }

  return (
    <div className="export-panel">
      <div className="export-panel__actions">
        <button
          className="btn btn--secondary"
          onClick={handleExportJsonl}
          disabled={entries.length === 0}
        >
          Export JSONL
        </button>
        <button
          className="btn btn--secondary"
          onClick={handleExportMarkdown}
          disabled={entries.length === 0}
        >
          Export Markdown
        </button>
        <button
          className="btn btn--danger"
          onClick={onClear}
          disabled={entries.length === 0}
        >
          Clear
        </button>
      </div>
      <span className="export-panel__count">{entries.length} entries</span>
    </div>
  );
}
