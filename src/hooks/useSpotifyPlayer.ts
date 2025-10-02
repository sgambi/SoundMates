import { useState, useEffect, useCallback, useRef } from 'react';
import { spotifyApi } from '../services/spotifyApi';
import type { SpotifyTrack } from '../types/spotify';

interface UseSpotifyPlayerOptions {
  autoConnect?: boolean;
  pollInterval?: number; // Intervallo di polling per aggiornare lo stato (ms)
}

interface PlayerState {
  isPlaying: boolean;
  currentTrack: SpotifyTrack | null;
  progressMs: number;
  durationMs: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'track' | 'context';
  deviceId: string | null;
}

interface UseSpotifyPlayerReturn {
  playerState: PlayerState;
  isLoading: boolean;
  error: string | null;
  play: (contextUri?: string, uris?: string[], offset?: number) => Promise<void>;
  pause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
  refreshState: () => Promise<void>;
}

/**
 * Hook per gestire il player Spotify
 * Fornisce controllo completo sulla riproduzione e lo stato del player
 */
export const useSpotifyPlayer = (options: UseSpotifyPlayerOptions = {}): UseSpotifyPlayerReturn => {
  const { autoConnect = true, pollInterval = 3000 } = options;

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    progressMs: 0,
    durationMs: 0,
    volume: 100,
    shuffle: false,
    repeat: 'off',
    deviceId: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  /**
   * Aggiorna lo stato del player da Spotify
   */
  const refreshState = useCallback(async () => {
    try {
      const state = await spotifyApi.getPlaybackState();

      if (state) {
        setPlayerState({
          isPlaying: state.is_playing,
          currentTrack: state.item,
          progressMs: state.progress_ms,
          durationMs: state.item?.duration_ms || 0,
          volume: state.device.volume_percent,
          shuffle: state.shuffle_state,
          repeat: state.repeat_state,
          deviceId: state.device.id,
        });
        setError(null);
      } else {
        // Nessun device attivo
        setPlayerState(prev => ({
          ...prev,
          isPlaying: false,
          currentTrack: null,
          deviceId: null,
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      console.error('Errore nel recupero dello stato del player:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Avvia o riprende la riproduzione
   */
  const play = useCallback(async (contextUri?: string, uris?: string[], offset?: number) => {
    try {
      await spotifyApi.play(playerState.deviceId || undefined, contextUri, uris, offset);
      // Attendi un attimo prima di aggiornare lo stato
      setTimeout(refreshState, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante la riproduzione';
      setError(errorMessage);
      throw err;
    }
  }, [playerState.deviceId, refreshState]);

  /**
   * Mette in pausa la riproduzione
   */
  const pause = useCallback(async () => {
    try {
      await spotifyApi.pause(playerState.deviceId || undefined);
      setTimeout(refreshState, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante la pausa';
      setError(errorMessage);
      throw err;
    }
  }, [playerState.deviceId, refreshState]);

  /**
   * Salta alla traccia successiva
   */
  const skipToNext = useCallback(async () => {
    try {
      await spotifyApi.skipToNext(playerState.deviceId || undefined);
      setTimeout(refreshState, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante lo skip';
      setError(errorMessage);
      throw err;
    }
  }, [playerState.deviceId, refreshState]);

  /**
   * Torna alla traccia precedente
   */
  const skipToPrevious = useCallback(async () => {
    try {
      await spotifyApi.skipToPrevious(playerState.deviceId || undefined);
      setTimeout(refreshState, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante lo skip indietro';
      setError(errorMessage);
      throw err;
    }
  }, [playerState.deviceId, refreshState]);

  /**
   * Cerca una posizione specifica nella traccia
   */
  const seek = useCallback(async (positionMs: number) => {
    try {
      await spotifyApi.seek(positionMs, playerState.deviceId || undefined);
      setPlayerState(prev => ({ ...prev, progressMs: positionMs }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il seek';
      setError(errorMessage);
      throw err;
    }
  }, [playerState.deviceId]);

  /**
   * Imposta il volume
   */
  const setVolume = useCallback(async (volume: number) => {
    try {
      await spotifyApi.setVolume(volume, playerState.deviceId || undefined);
      setPlayerState(prev => ({ ...prev, volume }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore impostazione volume';
      setError(errorMessage);
      throw err;
    }
  }, [playerState.deviceId]);

  /**
   * Attiva/disattiva shuffle
   */
  const toggleShuffle = useCallback(async () => {
    try {
      const newState = !playerState.shuffle;
      await spotifyApi.setShuffle(newState, playerState.deviceId || undefined);
      setPlayerState(prev => ({ ...prev, shuffle: newState }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore toggle shuffle';
      setError(errorMessage);
      throw err;
    }
  }, [playerState.shuffle, playerState.deviceId]);

  /**
   * Cicla tra le modalità repeat
   */
  const toggleRepeat = useCallback(async () => {
    try {
      const repeatStates: Array<'off' | 'context' | 'track'> = ['off', 'context', 'track'];
      const currentIndex = repeatStates.indexOf(playerState.repeat);
      const newState = repeatStates[(currentIndex + 1) % repeatStates.length];

      await spotifyApi.setRepeat(newState, playerState.deviceId || undefined);
      setPlayerState(prev => ({ ...prev, repeat: newState }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore toggle repeat';
      setError(errorMessage);
      throw err;
    }
  }, [playerState.repeat, playerState.deviceId]);

  // Inizializza il player e avvia il polling
  useEffect(() => {
    if (autoConnect) {
      refreshState();
    }

    // Avvia il polling per aggiornamenti periodici
    if (pollInterval > 0) {
      pollingIntervalRef.current = setInterval(refreshState, pollInterval);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [autoConnect, pollInterval, refreshState]);

  // Aggiorna il progress localmente quando sta suonando
  useEffect(() => {
    if (!playerState.isPlaying) return;

    const progressInterval = setInterval(() => {
      setPlayerState(prev => {
        const newProgress = prev.progressMs + 1000;
        if (newProgress >= prev.durationMs) {
          return prev; // Lascia che il polling gestisca il cambio traccia
        }
        return { ...prev, progressMs: newProgress };
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [playerState.isPlaying]);

  return {
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
    refreshState,
  };
};
