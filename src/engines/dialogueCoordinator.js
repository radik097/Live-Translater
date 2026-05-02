import { createScribeEngine } from './scribeEngine.js';
import { createStableChunkEngine } from './stableChunkEngine.js';
import { translate } from './translatorClient.js';
import { speak } from './ttsClient.js';
import { createPlaybackQueue } from '../audio/playbackQueue.js';
import { getUserMedia } from '../audio/deviceManager.js';

export function createDialogueCoordinator(configA, configB) {
  let engineA = null;
  let engineB = null;
  let queueA = null;
  let queueB = null;
  let streamA = null;
  let streamB = null;
  let active = false;

  let isPlayingA = false;
  let isPlayingB = false;

  async function startPipeline(config, otherIsPlaying) {
    const token = await getToken();

    const queue = createPlaybackQueue(config.outputDeviceId);

    const stableChunk = createStableChunkEngine({
      onChunk: async (chunk) => {
        if (otherIsPlaying()) return; // Anti-echo: skip if other side is playing
        try {
          const translated = await translate(
            chunk,
            config.sourceLang,
            config.targetLang,
            config.mode || 'fast'
          );
          if (!translated) return;

          config.onTranslation?.({ original: chunk, translated });

          const audioBlob = await speak(translated, config.voiceId, config.targetLang);
          if (audioBlob) queue.enqueue(audioBlob);
        } catch (err) {
          console.error('Dialogue pipeline error:', err.message);
        }
      },
    });

    const stream = await getUserMedia(config.inputDeviceId);
    const engine = createScribeEngine({
      token,
      language: config.sourceLang,
      onPartial: config.onPartial,
      onCommitted: (text) => {
        config.onCommitted?.(text);
        stableChunk.processCommitted(text);
      },
    });

    await engine.start(stream);
    return { engine, queue, stream };
  }

  const coordinator = {
    async start() {
      if (active) return;
      active = true;

      try {
        const pipelineA = await startPipeline(configA, () => isPlayingB);
        engineA = pipelineA.engine;
        queueA = pipelineA.queue;
        streamA = pipelineA.stream;

        queueA.onPlay = () => { isPlayingA = true; };
        queueA.onIdle = () => { isPlayingA = false; };

        const pipelineB = await startPipeline(configB, () => isPlayingA);
        engineB = pipelineB.engine;
        queueB = pipelineB.queue;
        streamB = pipelineB.stream;

        queueB.onPlay = () => { isPlayingB = true; };
        queueB.onIdle = () => { isPlayingB = false; };
      } catch (err) {
        active = false;
        throw err;
      }
    },

    stop() {
      active = false;
      engineA?.stop();
      engineB?.stop();
      queueA?.clear();
      queueB?.clear();
      streamA?.getTracks().forEach((t) => t.stop());
      streamB?.getTracks().forEach((t) => t.stop());
      engineA = engineB = queueA = queueB = streamA = streamB = null;
    },

    get isActive() {
      return active;
    },
  };

  return coordinator;
}

async function getToken() {
  const res = await fetch('/api/scribe-token', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to get Scribe token');
  const data = await res.json();
  return data.token;
}
