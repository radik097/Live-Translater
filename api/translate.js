export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, sourceLang, targetLang, mode } = req.body || {};
  if (!text || !sourceLang || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields: text, sourceLang, targetLang' });
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const deeplKey = process.env.DEEPL_API_KEY;

  if (openrouterKey) {
    try {
      const translated = await translateWithOpenRouter(text, sourceLang, targetLang, openrouterKey);
      return res.status(200).json({ translated });
    } catch (err) {
      console.error('OpenRouter failed:', err.message);
      if (!deeplKey) {
        return res.status(500).json({ error: 'Translation failed: ' + err.message });
      }
    }
  }

  if (deeplKey) {
    try {
      const translated = await translateWithDeepL(text, sourceLang, targetLang, deeplKey);
      return res.status(200).json({ translated });
    } catch (err) {
      return res.status(500).json({ error: 'DeepL translation failed: ' + err.message });
    }
  }

  return res.status(500).json({ error: 'No translation API keys configured' });
}

async function translateWithOpenRouter(text, sourceLang, targetLang, apiKey) {
  const systemPrompt = `Translate from ${sourceLang} to ${targetLang}. Keep the meaning. Be concise. Do not explain. Return only translated text.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://live-translater.vercel.app',
      'X-Title': 'Live Translater',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const translated = data.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error('Empty response from OpenRouter');
  return translated;
}

async function translateWithDeepL(text, sourceLang, targetLang, apiKey) {
  const params = new URLSearchParams({
    auth_key: apiKey,
    text,
    source_lang: sourceLang.toUpperCase(),
    target_lang: targetLang.toUpperCase(),
  });

  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepL error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const translated = data.translations?.[0]?.text;
  if (!translated) throw new Error('Empty response from DeepL');
  return translated;
}
