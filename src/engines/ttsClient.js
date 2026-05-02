export async function speak(text, voiceId, language) {
  if (!text || !text.trim()) return null;

  const response = await fetch('/api/tts-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.trim(), voiceId, language }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `TTS request failed: ${response.status}`);
  }

  const blob = await response.blob();
  return blob;
}
