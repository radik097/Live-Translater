const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
];

export default function VoiceSelector({ label, value, onChange }) {
  return (
    <div className="voice-selector">
      {label && <label className="voice-selector__label">{label}</label>}
      <select
        className="voice-selector__select"
        value={value || VOICES[0].id}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {VOICES.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>
    </div>
  );
}
