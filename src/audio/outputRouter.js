export function createOutputRouter() {
  return {
    async playOnDevice(audioBlob, deviceId) {
      return playOnDevice(audioBlob, deviceId);
    },
  };
}

export async function playOnDevice(audioBlob, deviceId) {
  const url = URL.createObjectURL(audioBlob);
  const audio = new Audio(url);

  if (deviceId && typeof audio.setSinkId === 'function') {
    try {
      await audio.setSinkId(deviceId);
    } catch (err) {
      console.warn('setSinkId failed:', err.message);
    }
  }

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    audio.play().catch(reject);
  });
}
