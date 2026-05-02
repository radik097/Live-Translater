export default function DeviceSelector({
  inputDevices = [],
  outputDevices = [],
  selectedInput,
  selectedOutput,
  onInputChange,
  onOutputChange,
  onRefresh,
  label,
}) {
  return (
    <div className="device-selector">
      {label && <h3 className="device-selector__label">{label}</h3>}
      <div className="device-selector__row">
        <div className="device-selector__field">
          <label>Microphone</label>
          <select value={selectedInput || ''} onChange={(e) => onInputChange?.(e.target.value)}>
            <option value="">Default</option>
            {inputDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
        <div className="device-selector__field">
          <label>Speaker</label>
          <select value={selectedOutput || ''} onChange={(e) => onOutputChange?.(e.target.value)}>
            <option value="">Default</option>
            {outputDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Speaker ${d.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
        {onRefresh && (
          <button className="btn btn--icon" onClick={onRefresh} title="Refresh devices">
            ↺
          </button>
        )}
      </div>
    </div>
  );
}
