export function createPlaybackQueue(outputDeviceId) {
  let queue = [];
  let playing = false;
  let currentAudio = null;
  let sinkId = outputDeviceId || '';

  const instance = {
    onPlay: null,
    onIdle: null,

    enqueue(audioBlob) {
      queue.push(audioBlob);
      if (!playing) {
        playNext();
      }
    },

    clear() {
      queue = [];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
      }
      playing = false;
      instance.onIdle?.();
    },

    getStatus() {
      return { playing, queueLength: queue.length };
    },

    setOutputDevice(id) {
      sinkId = id || '';
    },
  };

  async function playNext() {
    if (queue.length === 0) {
      playing = false;
      instance.onIdle?.();
      return;
    }
    playing = true;
    const blob = queue.shift();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    if (sinkId && typeof audio.setSinkId === 'function') {
      try {
        await audio.setSinkId(sinkId);
      } catch (err) {
        console.warn('setSinkId failed:', err.message);
      }
    }

    instance.onPlay?.();

    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      playNext();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      playNext();
    };

    try {
      await audio.play();
    } catch (err) {
      console.error('Audio play error:', err);
      playNext();
    }
  }

  return instance;
}
