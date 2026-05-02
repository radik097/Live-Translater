export async function listInputDevices() {
  await ensurePermission();
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'audioinput');
}

export async function listOutputDevices() {
  await ensurePermission();
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'audiooutput');
}

export async function getUserMedia(deviceId, options = {}) {
  const constraints = {
    audio: {
      echoCancellation: options.echoCancellation ?? true,
      noiseSuppression: options.noiseSuppression ?? true,
      autoGainControl: options.autoGainControl ?? true,
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    },
    video: false,
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

export async function setOutputDevice(audioElement, deviceId) {
  if (!audioElement || !deviceId) return;
  if (typeof audioElement.setSinkId === 'function') {
    try {
      await audioElement.setSinkId(deviceId);
    } catch (err) {
      console.warn('setSinkId failed:', err.message);
    }
  }
}

export async function testMicrophone(deviceId, onLevel) {
  let stream;
  let animFrameId;
  try {
    stream = await getUserMedia(deviceId);
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
      onLevel(avg / 255);
      animFrameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animFrameId);
      stream.getTracks().forEach((t) => t.stop());
      audioCtx.close();
    };
  } catch (err) {
    console.error('testMicrophone error:', err);
    return () => {};
  }
}

async function ensurePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    // Permission denied or not available
  }
}
