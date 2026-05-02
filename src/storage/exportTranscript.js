export function exportAsJsonl(entries) {
  const lines = entries.map((e) => JSON.stringify(e));
  return lines.join('\n');
}

export function exportAsMarkdown(entries) {
  const date = new Date().toLocaleString();
  const lines = [`# Live Translater Session`, `*Exported: ${date}*`, ''];

  for (const entry of entries) {
    const time = new Date(entry.ts).toLocaleTimeString();
    const direction = entry.direction ? ` (${entry.direction})` : '';
    lines.push(`---`);
    lines.push(`**[${time}]${direction}** \`${entry.sourceLang} → ${entry.targetLang}\``);
    lines.push(`**Original:** ${entry.original}`);
    lines.push(`**Translated:** ${entry.translated}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
