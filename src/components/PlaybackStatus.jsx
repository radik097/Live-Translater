export default function PlaybackStatus({ isPlaying, queueLength, deviceId }) {
  return (
    <div className={`playback-status ${isPlaying ? 'playback-status--playing' : ''}`}>
      <span
        className={`playback-status__indicator ${
          isPlaying ? 'playback-status__indicator--active' : ''
        }`}
      />
      <span className="playback-status__text">
        {isPlaying ? `Playing (${queueLength} queued)` : 'Idle'}
      </span>
      {deviceId && <span className="playback-status__device">🔊 Custom output</span>}
    </div>
  );
}
