import { useState, useCallback } from 'react';
import { spotifyApi } from '../services/spotifyApi';
import type { SpotifyPlaylist, SpotifyTrack, AudioFeatures, SpotifyArtist } from '../types/spotify';

interface PlaylistAnalysis {
  playlist: SpotifyPlaylist;
  tracks: SpotifyTrack[];
  totalTracks: number;
  totalDuration: number;
  audioFeatures: {
    avgDanceability: number;
    avgEnergy: number;
    avgValence: number;
    avgTempo: number;
    avgAcousticness: number;
    avgInstrumentalness: number;
    avgLiveness: number;
    avgSpeechiness: number;
  };
  topArtists: Array<{ artist: SpotifyArtist; count: number }>;
  genreDistribution: Array<{ genre: string; count: number }>;
  explicitCount: number;
  popularityAvg: number;
}

interface UsePlaylistAnalysisReturn {
  analysis: PlaylistAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzePlaylist: (playlistId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook per analizzare le caratteristiche di una playlist Spotify
 * Fornisce statistiche dettagliate su tracce, artisti, audio features, ecc.
 */
export const usePlaylistAnalysis = (): UsePlaylistAnalysisReturn => {
  const [analysis, setAnalysis] = useState<PlaylistAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analizza una playlist e calcola tutte le statistiche
   */
  const analyzePlaylist = useCallback(async (playlistId: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Ottieni i dettagli della playlist
      const playlist = await spotifyApi.getPlaylist(playlistId);

      // 2. Ottieni tutte le tracce
      const tracks = await spotifyApi.getAllPlaylistTracks(playlistId);

      if (tracks.length === 0) {
        throw new Error('La playlist è vuota');
      }

      // 3. Ottieni le audio features per tutte le tracce (max 100 per volta)
      const audioFeaturesArray: AudioFeatures[] = [];
      const batchSize = 100;

      for (let i = 0; i < tracks.length; i += batchSize) {
        const batch = tracks.slice(i, i + batchSize);
        const trackIds = batch.map(track => track.id).filter(id => id);

        if (trackIds.length > 0) {
          const { audio_features } = await spotifyApi.getMultipleAudioFeatures(trackIds);
          audioFeaturesArray.push(...audio_features.filter(f => f !== null));
        }
      }

      // 4. Calcola statistiche audio features
      const avgAudioFeatures = {
        avgDanceability: average(audioFeaturesArray.map(f => f.danceability)),
        avgEnergy: average(audioFeaturesArray.map(f => f.energy)),
        avgValence: average(audioFeaturesArray.map(f => f.valence)),
        avgTempo: average(audioFeaturesArray.map(f => f.tempo)),
        avgAcousticness: average(audioFeaturesArray.map(f => f.acousticness)),
        avgInstrumentalness: average(audioFeaturesArray.map(f => f.instrumentalness)),
        avgLiveness: average(audioFeaturesArray.map(f => f.liveness)),
        avgSpeechiness: average(audioFeaturesArray.map(f => f.speechiness)),
      };

      // 5. Analizza artisti
      const artistMap = new Map<string, { artist: SpotifyArtist; count: number }>();

      tracks.forEach(track => {
        track.artists.forEach(artist => {
          const existing = artistMap.get(artist.id);
          if (existing) {
            existing.count++;
          } else {
            artistMap.set(artist.id, { artist, count: 1 });
          }
        });
      });

      const topArtists = Array.from(artistMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 6. Calcola durata totale
      const totalDuration = tracks.reduce((sum, track) => sum + track.duration_ms, 0);

      // 7. Conta tracce esplicite
      const explicitCount = tracks.filter(track => track.explicit).length;

      // 8. Calcola popolarità media
      const popularityAvg = average(tracks.map(track => track.popularity));

      // 9. Distribuzione generi (richiede chiamate aggiuntive agli artisti - opzionale)
      // Per ora usiamo un array vuoto, si può implementare in seguito
      const genreDistribution: Array<{ genre: string; count: number }> = [];

      // Crea l'analisi completa
      const playlistAnalysis: PlaylistAnalysis = {
        playlist,
        tracks,
        totalTracks: tracks.length,
        totalDuration,
        audioFeatures: avgAudioFeatures,
        topArtists,
        genreDistribution,
        explicitCount,
        popularityAvg,
      };

      setAnalysis(playlistAnalysis);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'analisi';
      setError(errorMessage);
      console.error('Errore nell\'analisi della playlist:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Reset dello stato
   */
  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyzePlaylist,
    reset,
  };
};

/**
 * Calcola la media di un array di numeri
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * Utility per ottenere una descrizione testuale delle caratteristiche audio
 */
export function getAudioFeatureDescription(value: number, feature: string): string {
  const percentage = Math.round(value * 100);

  switch (feature) {
    case 'danceability':
      if (percentage >= 80) return `Molto ballabile (${percentage}%)`;
      if (percentage >= 60) return `Ballabile (${percentage}%)`;
      if (percentage >= 40) return `Moderatamente ballabile (${percentage}%)`;
      return `Poco ballabile (${percentage}%)`;

    case 'energy':
      if (percentage >= 80) return `Molto energica (${percentage}%)`;
      if (percentage >= 60) return `Energica (${percentage}%)`;
      if (percentage >= 40) return `Moderatamente energica (${percentage}%)`;
      return `Calma (${percentage}%)`;

    case 'valence':
      if (percentage >= 80) return `Molto positiva (${percentage}%)`;
      if (percentage >= 60) return `Positiva (${percentage}%)`;
      if (percentage >= 40) return `Neutrale (${percentage}%)`;
      return `Malinconica (${percentage}%)`;

    case 'acousticness':
      if (percentage >= 80) return `Molto acustica (${percentage}%)`;
      if (percentage >= 60) return `Acustica (${percentage}%)`;
      return `Elettronica (${percentage}%)`;

    default:
      return `${percentage}%`;
  }
}

/**
 * Utility per formattare la durata in ore e minuti
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
