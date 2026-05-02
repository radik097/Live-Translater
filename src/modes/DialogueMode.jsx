import { useState, useEffect, useRef, useCallback } from 'react';
import DeviceSelector from '../components/DeviceSelector.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import VoiceSelector from '../components/VoiceSelector.jsx';
import LiveTranscript from '../components/LiveTranscript.jsx';
import ExportPanel from '../components/ExportPanel.jsx';
import { listInputDevices, listOutputDevices } from '../audio/deviceManager.js';
import { createDialogueCoordinator } from '../engines/dialogueCoordinator.js';
import { addEntry, getEntries, clearEntries } from '../storage/transcriptStore.js';
import { saveSettings, loadSettings } from '../storage/settingsStore.js';

export default function DialogueMode({ onDebugUpdate }) {
  const saved = loadSettings() || {};

  const [inputDevices, setInputDevices] = useState([]);
  const [outputDevices, setOutputDevices] = useState([]);

  // Person A config
  const [inputA, setInputA] = useState(saved.dialogInputA || '');
  const [outputA, setOutputA] = useState(saved.dialogOutputA || '');
  const [langA, setLangA] = useState(saved.dialogLangA || 'en');
  const [voiceA, setVoiceA] = useState(saved.dialogVoiceA || '21m00Tcm4TlvDq8ikWAM');

  // Person B config
  const [inputB, setInputB] = useState(saved.dialogInputB || '');
  const [outputB, setOutputB] = useState(saved.dialogOutputB || '');
  const [langB, setLangB] = useState(saved.dialogLangB || 'ru');
  const [voiceB, setVoiceB] = useState(saved.dialogVoiceB || 'pNInz6obpgDQGcFmaJgB');

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [partialA, setPartialA] = useState('');
  const [partialB, setPartialB] = useState('');
  const [entriesA, setEntriesA] = useState([]);
  const [entriesB, setEntriesB] = useState([]);

  const coordinatorRef = useRef(null);

  useEffect(() => {
    refreshDevices();
    getEntries().then((all) => {
      setEntriesA(all.filter((e) => e.direction === 'A→B'));
      setEntriesB(all.filter((e) => e.direction === 'B→A'));
    });
  }, []);

  useEffect(() => {
    saveSettings({
      ...loadSettings(),
      dialogInputA: inputA,
      dialogOutputA: outputA,
      dialogLangA: langA,
      dialogVoiceA: voiceA,
      dialogInputB: inputB,
      dialogOutputB: outputB,
      dialogLangB: langB,
      dialogVoiceB: voiceB,
    });
  }, [inputA, outputA, langA, voiceA, inputB, outputB, langB, voiceB]);

  async function refreshDevices() {
    const [inputs, outputs] = await Promise.all([listInputDevices(), listOutputDevices()]);
    setInputDevices(inputs);
    setOutputDevices(outputs);
  }

  const handleStart = useCallback(async () => {
    setStatus('connecting');
    try {
      const configA = {
        inputDeviceId: inputA,
        outputDeviceId: outputA,
        sourceLang: langA,
        targetLang: langB,
        voiceId: voiceA,
        mode: 'fast',
        onPartial: (text) => setPartialA(text),
        onCommitted: (text) => setPartialA(text),
        onTranslation: async ({ original, translated }) => {
          const entry = {
            ts: Date.now(),
            mode: 'dialogue',
            direction: 'A→B',
            sourceLang: langA,
            targetLang: langB,
            original,
            translated,
          };
          await addEntry(entry);
          setEntriesA((prev) => [...prev, entry]);
          setPartialA('');
        },
      };

      const configB = {
        inputDeviceId: inputB,
        outputDeviceId: outputB,
        sourceLang: langB,
        targetLang: langA,
        voiceId: voiceB,
        mode: 'fast',
        onPartial: (text) => setPartialB(text),
        onCommitted: (text) => setPartialB(text),
        onTranslation: async ({ original, translated }) => {
          const entry = {
            ts: Date.now(),
            mode: 'dialogue',
            direction: 'B→A',
            sourceLang: langB,
            targetLang: langA,
            original,
            translated,
          };
          await addEntry(entry);
          setEntriesB((prev) => [...prev, entry]);
          setPartialB('');
        },
      };

      const coordinator = createDialogueCoordinator(configA, configB);
      await coordinator.start();
      coordinatorRef.current = coordinator;

      setRunning(true);
      setStatus('active');
    } catch (err) {
      setStatus(`error: ${err.message}`);
      console.error('Dialogue start error:', err);
    }
  }, [inputA, outputA, langA, voiceA, inputB, outputB, langB, voiceB]);

  const handleStop = useCallback(() => {
    coordinatorRef.current?.stop();
    coordinatorRef.current = null;
    setRunning(false);
    setStatus('idle');
    setPartialA('');
    setPartialB('');
  }, []);

  const handleClear = useCallback(async () => {
    await clearEntries();
    setEntriesA([]);
    setEntriesB([]);
  }, []);

  return (
    <div className="dialogue-mode">
      <div className="dialogue-mode__panels">
        {/* Person A */}
        <div className="dialogue-panel">
          <h3 className="dialogue-panel__title">Person A ({langA})</h3>
          <DeviceSelector
            inputDevices={inputDevices}
            outputDevices={outputDevices}
            selectedInput={inputA}
            selectedOutput={outputA}
            onInputChange={setInputA}
            onOutputChange={setOutputA}
            onRefresh={refreshDevices}
            label="Person A Devices"
          />
          <div className="settings-row">
            <LanguageSelector label="Language" value={langA} onChange={setLangA} />
            <VoiceSelector label="Voice" value={voiceA} onChange={setVoiceA} />
          </div>
          <LiveTranscript
            partialText={partialA}
            entries={entriesA}
            direction="A→B"
          />
        </div>

        <div className="dialogue-mode__divider">⇄</div>

        {/* Person B */}
        <div className="dialogue-panel">
          <h3 className="dialogue-panel__title">Person B ({langB})</h3>
          <DeviceSelector
            inputDevices={inputDevices}
            outputDevices={outputDevices}
            selectedInput={inputB}
            selectedOutput={outputB}
            onInputChange={setInputB}
            onOutputChange={setOutputB}
            label="Person B Devices"
          />
          <div className="settings-row">
            <LanguageSelector label="Language" value={langB} onChange={setLangB} />
            <VoiceSelector label="Voice" value={voiceB} onChange={setVoiceB} />
          </div>
          <LiveTranscript
            partialText={partialB}
            entries={entriesB}
            direction="B→A"
          />
        </div>
      </div>

      <div className="dialogue-mode__controls">
        <button
          className={`btn ${running ? 'btn--danger' : 'btn--primary'}`}
          onClick={running ? handleStop : handleStart}
        >
          {running ? '⏹ Stop Dialogue' : '▶ Start Dialogue'}
        </button>

        <div
          className={`status-badge status-badge--${
            status === 'active'
              ? 'active'
              : status === 'connecting'
              ? 'warning'
              : status.startsWith('error')
              ? 'error'
              : 'idle'
          }`}
        >
          {status}
        </div>

        {running && (
          <div className="anti-echo-badge">🛡 Anti-echo active</div>
        )}
      </div>

      <ExportPanel entries={[...entriesA, ...entriesB]} onClear={handleClear} />
    </div>
  );
}
