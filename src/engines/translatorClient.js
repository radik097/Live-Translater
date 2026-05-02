export async function translate(text, sourceLang, targetLang, mode = 'fast') {
  if (!text || !text.trim()) return '';

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), sourceLang, targetLang, mode }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `Translation request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.translated || '';
  } catch (err) {
    console.error('Translation error:', err.message);
    throw err;
  }
}
