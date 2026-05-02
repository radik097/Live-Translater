export function createMicrophoneInput(deviceId, options = {}) {
  let stream = null;
  let recorder = null;
  let audioDataCallback = null;
  let active = false;

  const instance = {
    onAudioData(callback) {
      audioDataCallback = callback;
    },

    async start() {
      if (active) return;
      active = true;

      const constraints = {
        audio: {
          echoCancellation: options.echoCancellation ?? true,
          noiseSuppression: options.noiseSuppression ?? true,
          autoGainControl: options.autoGainControl ?? true,
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
        video: false,
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);

      const mimeType = getSupportedMimeType();
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0 && audioDataCallback) {
          audioDataCallback(event.data);
        }
      };

      recorder.start(options.chunkInterval ?? 250);
    },

    stop() {
      active = false;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      recorder = null;
      stream = null;
    },

    get isActive() {
      return active;
    },
  };

  return instance;
}

function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}
