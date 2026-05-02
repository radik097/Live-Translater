export function createStableChunkEngine({ onChunk }) {
  let lastSent = '';

  const instance = {
    processCommitted(text) {
      if (!text || text.trim() === '') return;

      const normalized = text.trim();

      // Avoid sending duplicate content
      if (normalized === lastSent) return;

      // Find the new portion relative to what was last sent
      let toSend = normalized;
      if (lastSent && normalized.startsWith(lastSent)) {
        toSend = normalized.slice(lastSent.length).trim();
      } else if (lastSent && normalized.includes(lastSent)) {
        const idx = normalized.indexOf(lastSent);
        toSend = normalized.slice(idx + lastSent.length).trim();
      }

      if (!toSend) return;

      lastSent = normalized;

      const chunks = splitIntoChunks(toSend);
      for (const chunk of chunks) {
        if (chunk.trim()) {
          onChunk?.(chunk.trim());
        }
      }
    },

    reset() {
      lastSent = '';
    },
  };

  return instance;
}

function splitIntoChunks(text) {
  // Split on sentence boundaries for natural chunking
  const sentenceEnd = /[.!?。！？]+\s*/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = sentenceEnd.exec(text)) !== null) {
    parts.push(text.slice(lastIndex, match.index + match[0].length));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
