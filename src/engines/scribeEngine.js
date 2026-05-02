export function createScribeEngine({ token, language, onPartial, onCommitted }) {
  let ws = null;
  let micInput = null;
  let active = false;

  const instance = {
    async start(stream) {
      if (active) return;
      active = true;

      const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/stream?xi-api-key=${encodeURIComponent(token)}&language_code=${encodeURIComponent(language || 'en')}`;

      ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        // Start capturing audio from stream and sending to WebSocket
        startSendingAudio(stream);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch (_) {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = (err) => {
        console.error('Scribe WebSocket error:', err);
      };

      ws.onclose = () => {
        active = false;
      };
    },

    stop() {
      active = false;
      if (micInput) {
        micInput.stop();
        micInput = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
    },
  };

  function handleMessage(msg) {
    const type = msg.type;
    if (type === 'transcript') {
      const text = msg.text || msg.transcript || '';
      const isFinal = msg.is_final ?? msg.isFinal ?? false;
      if (isFinal) {
        onCommitted?.(text);
      } else {
        onPartial?.(text);
      }
    } else if (type === 'partial_transcript') {
      onPartial?.(msg.text || '');
    } else if (type === 'final_transcript') {
      onCommitted?.(msg.text || '');
    }
  }

  function startSendingAudio(stream) {
    if (!stream) return;

    const mimeType = getSupportedMimeType();
    let recorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    } catch (_) {
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = async (event) => {
      if (!event.data || event.data.size === 0) return;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const buffer = await event.data.arrayBuffer();
      ws.send(buffer);
    };

    recorder.start(250);
    micInput = {
      stop: () => {
        if (recorder.state !== 'inactive') recorder.stop();
        stream.getTracks().forEach((t) => t.stop());
      },
    };
  }

  function getSupportedMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }

  return instance;
}
