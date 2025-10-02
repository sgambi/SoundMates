import { useEffect, useState } from 'react';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import '../styles/SpotifyPlayer.css';

interface SpotifyPlayerProps {
  className?: string;
}

/**
 * Componente player Spotify con controlli completi
 */
const SpotifyPlayer = ({ className = '' }: SpotifyPlayerProps) => {
  const {
    playerState,
    isLoading,
    error,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = useSpotifyPlayer({ pollInterval: 3000 });

  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [localVolume, setLocalVolume] = useState(100);

  useEffect(() => {
    if (!isDraggingProgress) {
      setLocalProgress(playerState.progressMs);
    }
  }, [playerState.progressMs, isDraggingProgress]);

  useEffect(() => {
    if (!isDraggingVolume) {
      setLocalVolume(playerState.volume);
    }
  }, [playerState.volume, isDraggingVolume]);

  const handlePlayPause = async () => {
    try {
      if (playerState.isPlaying) {
        await pause();
      } else {
        await play();
      }
    } catch (err) {
      console.error('Errore play/pause:', err);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setLocalProgress(value);
  };

  const handleProgressMouseDown = () => {
    setIsDraggingProgress(true);
  };

  const handleProgressMouseUp = async () => {
    setIsDraggingProgress(false);
    try {
      await seek(localProgress);
    } catch (err) {
      console.error('Errore seek:', err);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setLocalVolume(value);
  };

  const handleVolumeMouseDown = () => {
    setIsDraggingVolume(true);
  };

  const handleVolumeMouseUp = async () => {
    setIsDraggingVolume(false);
    try {
      await setVolume(localVolume);
    } catch (err) {
      console.error('Errore volume:', err);
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={`spotify-player ${className}`}>
        <div className="player-loading">Caricamento player...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`spotify-player ${className}`}>
        <div className="player-error">
          <p>⚠️ {error}</p>
          <p className="error-hint">
            Assicurati di avere Spotify aperto su un dispositivo e un account Premium attivo.
          </p>
        </div>
      </div>
    );
  }

  if (!playerState.currentTrack) {
    return (
      <div className={`spotify-player ${className}`}>
        <div className="player-empty">
          <p>🎵 Nessuna traccia in riproduzione</p>
          <p className="empty-hint">Avvia la riproduzione da Spotify</p>
        </div>
      </div>
    );
  }

  const { currentTrack } = playerState;
  const progressPercent = (localProgress / playerState.durationMs) * 100 || 0;

  return (
    <div className={`spotify-player ${className}`}>
      {/* Informazioni traccia */}
      <div className="player-track-info">
        {currentTrack.album.images[0] && (
          <img
            src={currentTrack.album.images[0].url}
            alt={currentTrack.album.name}
            className="track-cover"
          />
        )}
        <div className="track-details">
          <h3 className="track-name">{currentTrack.name}</h3>
          <p className="track-artist">
            {currentTrack.artists.map(artist => artist.name).join(', ')}
          </p>
        </div>
      </div>

      {/* Controlli principali */}
      <div className="player-controls">
        <div className="control-buttons">
          <button
            className={`control-btn shuffle ${playerState.shuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title="Shuffle"
          >
            🔀
          </button>

          <button
            className="control-btn"
            onClick={skipToPrevious}
            title="Precedente"
          >
            ⏮️
          </button>

          <button
            className="control-btn play-pause"
            onClick={handlePlayPause}
            title={playerState.isPlaying ? 'Pausa' : 'Riproduci'}
          >
            {playerState.isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            className="control-btn"
            onClick={skipToNext}
            title="Successivo"
          >
            ⏭️
          </button>

          <button
            className={`control-btn repeat ${playerState.repeat !== 'off' ? 'active' : ''}`}
            onClick={toggleRepeat}
            title={`Repeat: ${playerState.repeat}`}
          >
            {playerState.repeat === 'track' ? '🔂' : '🔁'}
          </button>
        </div>

        {/* Barra di progresso */}
        <div className="progress-bar">
          <span className="time-current">{formatTime(localProgress)}</span>
          <div className="progress-container">
            <div className="progress-bg">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={playerState.durationMs}
              value={localProgress}
              onChange={handleProgressChange}
              onMouseDown={handleProgressMouseDown}
              onMouseUp={handleProgressMouseUp}
              onTouchStart={handleProgressMouseDown}
              onTouchEnd={handleProgressMouseUp}
              className="progress-slider"
            />
          </div>
          <span className="time-total">{formatTime(playerState.durationMs)}</span>
        </div>
      </div>

      {/* Controllo volume */}
      <div className="player-volume">
        <span className="volume-icon">
          {localVolume === 0 ? '🔇' : localVolume < 50 ? '🔉' : '🔊'}
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={localVolume}
          onChange={handleVolumeChange}
          onMouseDown={handleVolumeMouseDown}
          onMouseUp={handleVolumeMouseUp}
          onTouchStart={handleVolumeMouseDown}
          onTouchEnd={handleVolumeMouseUp}
          className="volume-slider"
        />
        <span className="volume-value">{localVolume}%</span>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
