export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
  }

  if (!agentId) {
    return res.status(500).json({ error: 'ELEVENLABS_AGENT_ID not configured' });
  }

  try {
    const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/token');
    url.searchParams.set('agent_id', agentId);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'ElevenLabs token request failed',
        status: response.status,
        body: responseText,
      });
    }

    const data = JSON.parse(responseText);

    return res.status(200).json({
      token: data.token,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
