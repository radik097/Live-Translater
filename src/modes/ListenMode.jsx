import { useState, useEffect, useRef, useCallback } from 'react';
import DeviceSelector from '../components/DeviceSelector.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import VoiceSelector from '../components/VoiceSelector.jsx';
import LiveTranscript from '../components/LiveTranscript.jsx';
import PlaybackStatus from '../components/PlaybackStatus.jsx';
import ExportPanel from '../components/ExportPanel.jsx';
import { listInputDevices, listOutputDevices } from '../audio/deviceManager.js';
import { createScribeEngine } from '../engines/scribeEngine.js';
import { createStableChunkEngine } from '../engines/stableChunkEngine.js';
import { translate } from '../engines/translatorClient.js';
import { speak } from '../engines/ttsClient.js';
import { createPlaybackQueue } from '../audio/playbackQueue.js';
import { getUserMedia } from '../audio/deviceManager.js';
import { addEntry, getEntries, clearEntries } from '../storage/transcriptStore.js';
import { saveSettings, loadSettings } from '../storage/settingsStore.js';

const LATENCY_MODES = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'accurate', label: 'Accurate' },
];

export default function ListenMode({ onDebugUpdate }) {
  const saved = loadSettings() || {};

  const [inputDevices, setInputDevices] = useState([]);
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedInput, setSelectedInput] = useState(saved.listenInput || '');
  const [selectedOutput, setSelectedOutput] = useState(saved.listenOutput || '');
  const [sourceLang, setSourceLang] = useState(saved.listenSourceLang || 'en');
  const [targetLang, setTargetLang] = useState(saved.listenTargetLang || 'ru');
  const [voiceId, setVoiceId] = useState(saved.listenVoice || '21m00Tcm4TlvDq8ikWAM');
  const [latencyMode, setLatencyMode] = useState(saved.listenMode || 'fast');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [partialText, setPartialText] = useState('');
  const [entries, setEntries] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  const engineRef = useRef(null);
  const queueRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    refreshDevices();
    getEntries().then(setEntries);
  }, []);

  // Persist settings on change
  useEffect(() => {
    saveSettings({
      ...loadSettings(),
      listenInput: selectedInput,
      listenOutput: selectedOutput,
      listenSourceLang: sourceLang,
      listenTargetLang: targetLang,
      listenVoice: voiceId,
      listenMode: latencyMode,
    });
  }, [selectedInput, selectedOutput, sourceLang, targetLang, voiceId, latencyMode]);

  async function refreshDevices() {
    const [inputs, outputs] = await Promise.all([listInputDevices(), listOutputDevices()]);
    setInputDevices(inputs);
    setOutputDevices(outputs);
  }

  const handleStart = useCallback(async () => {
    setStatus('connecting');
    try {
      // Get scribe token
      const tokenRes = await fetch('/api/scribe-token', { method: 'POST' });
      if (!tokenRes.ok) throw new Error('Failed to get Scribe token');
      const { token } = await tokenRes.json();

      // Setup playback queue
      const queue = createPlaybackQueue(selectedOutput);
      queue.onPlay = () => {
        setIsPlaying(true);
        setQueueLength(queue.getStatus().queueLength);
      };
      queue.onIdle = () => {
        setIsPlaying(false);
        setQueueLength(0);
      };
      queueRef.current = queue;

      // Setup stable chunk engine for translation
      const stableChunk = createStableChunkEngine({
        onChunk: async (chunk) => {
          const t0 = Date.now();
          try {
            const translated = await translate(chunk, sourceLang, targetLang, latencyMode);
            if (!translated) return;

            const latencyMs = Date.now() - t0;
            onDebugUpdate?.({ lastTranslation: translated, latencyMs });

            const entry = {
              ts: Date.now(),
              mode: 'listen',
              sourceLang,
              targetLang,
              original: chunk,
              translated,
            };
            await addEntry(entry);
            setEntries((prev) => [...prev, entry]);

            const audioBlob = await speak(translated, voiceId, targetLang);
            if (audioBlob) {
              queue.enqueue(audioBlob);
              setQueueLength(queue.getStatus().queueLength);
            }
          } catch (err) {
            console.error('Pipeline error:', err.message);
            onDebugUpdate?.({ error: err.message });
          }
        },
      });

      // Get user media
      const stream = await getUserMedia(selectedInput);
      streamRef.current = stream;

      // Start scribe engine
      const engine = createScribeEngine({
        token,
        language: sourceLang,
        onPartial: (text) => {
          setPartialText(text);
          onDebugUpdate?.({ lastPartial: text, sttStatus: 'listening' });
        },
        onCommitted: (text) => {
          setPartialText('');
          onDebugUpdate?.({ lastCommitted: text });
          stableChunk.processCommitted(text);
        },
      });

      await engine.start(stream);
      engineRef.current = engine;

      setRunning(true);
      setStatus('listening');
    } catch (err) {
      setStatus(`error: ${err.message}`);
      console.error('Start error:', err);
    }
  }, [selectedInput, selectedOutput, sourceLang, targetLang, voiceId, latencyMode, onDebugUpdate]);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
    queueRef.current?.clear();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    engineRef.current = null;
    queueRef.current = null;
    streamRef.current = null;
    setRunning(false);
    setStatus('idle');
    setPartialText('');
    setIsPlaying(false);
    setQueueLength(0);
    onDebugUpdate?.({ sttStatus: 'idle' });
  }, [onDebugUpdate]);

  const handleClear = useCallback(async () => {
    await clearEntries();
    setEntries([]);
  }, []);

  return (
    <div className="listen-mode">
      <div className="settings-panel">
        <DeviceSelector
          inputDevices={inputDevices}
          outputDevices={outputDevices}
          selectedInput={selectedInput}
          selectedOutput={selectedOutput}
          onInputChange={setSelectedInput}
          onOutputChange={setSelectedOutput}
          onRefresh={refreshDevices}
        />

        <div className="settings-row">
          <LanguageSelector label="Source Language" value={sourceLang} onChange={setSourceLang} />
          <span className="settings-arrow">→</span>
          <LanguageSelector label="Target Language" value={targetLang} onChange={setTargetLang} />
        </div>

        <div className="settings-row">
          <VoiceSelector label="Voice" value={voiceId} onChange={setVoiceId} />
          <div className="language-selector">
            <label className="language-selector__label">Mode</label>
            <select
              className="language-selector__select"
              value={latencyMode}
              onChange={(e) => setLatencyMode(e.target.value)}
            >
              {LATENCY_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-row settings-row--actions">
          <button
            className={`btn ${running ? 'btn--danger' : 'btn--primary'}`}
            onClick={running ? handleStop : handleStart}
          >
            {running ? '⏹ Stop' : '▶ Start Listening'}
          </button>

          <div className={`status-badge status-badge--${status === 'listening' ? 'active' : status === 'connecting' ? 'warning' : status.startsWith('error') ? 'error' : 'idle'}`}>
            {status}
          </div>

          <PlaybackStatus
            isPlaying={isPlaying}
            queueLength={queueLength}
            deviceId={selectedOutput}
          />
        </div>
      </div>

      <LiveTranscript partialText={partialText} entries={entries} />
      <ExportPanel entries={entries} onClear={handleClear} />
    </div>
  );
}
