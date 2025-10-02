import { useState, useEffect } from 'react';
import { spotifyApi } from '../services/spotifyApi';
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify';
import '../styles/PlaylistSelector.css';

interface PlaylistSelectorProps {
  onPlaylistSelect?: (playlist: SpotifyPlaylist) => void;
  onTrackSelect?: (track: SpotifyTrack) => void;
  showTracks?: boolean;
  className?: string;
}

/**
 * Componente per visualizzare e selezionare le playlist dell'utente
 */
const PlaylistSelector = ({
  onPlaylistSelect,
  onTrackSelect,
  showTracks = false,
  className = '',
}: PlaylistSelectorProps) => {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Carica le playlist all'avvio
  useEffect(() => {
    loadPlaylists();
  }, []);

  // Carica le tracce quando viene selezionata una playlist
  useEffect(() => {
    if (selectedPlaylist && showTracks) {
      loadTracks(selectedPlaylist.id);
    }
  }, [selectedPlaylist, showTracks]);

  const loadPlaylists = async () => {
    setIsLoadingPlaylists(true);
    setError(null);

    try {
      const userPlaylists = await spotifyApi.getAllUserPlaylists();
      setPlaylists(userPlaylists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle playlist';
      setError(errorMessage);
      console.error('Errore nel caricamento delle playlist:', err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const loadTracks = async (playlistId: string) => {
    setIsLoadingTracks(true);
    setError(null);

    try {
      const playlistTracks = await spotifyApi.getAllPlaylistTracks(playlistId);
      setTracks(playlistTracks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle tracce';
      setError(errorMessage);
      console.error('Errore nel caricamento delle tracce:', err);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handlePlaylistClick = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    if (onPlaylistSelect) {
      onPlaylistSelect(playlist);
    }
  };

  const handleTrackClick = (track: SpotifyTrack) => {
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
    setTracks([]);
  };

  // Filtra le playlist in base alla ricerca
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtra le tracce in base alla ricerca
  const filteredTracks = tracks.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artists.some(artist => artist.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoadingPlaylists) {
    return (
      <div className={`playlist-selector ${className}`}>
        <div className="selector-loading">
          <p>Caricamento playlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`playlist-selector ${className}`}>
        <div className="selector-error">
          <p>⚠️ {error}</p>
          <button onClick={loadPlaylists} className="retry-button">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`playlist-selector ${className}`}>
      {/* Header con ricerca */}
      <div className="selector-header">
        {selectedPlaylist && showTracks ? (
          <button onClick={handleBackToPlaylists} className="back-button">
            ← Indietro
          </button>
        ) : null}
        <h2 className="selector-title">
          {selectedPlaylist && showTracks
            ? selectedPlaylist.name
            : 'Le tue playlist'}
        </h2>
        <input
          type="text"
          placeholder={selectedPlaylist && showTracks ? 'Cerca tracce...' : 'Cerca playlist...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Lista playlist */}
      {!selectedPlaylist || !showTracks ? (
        <div className="playlists-grid">
          {filteredPlaylists.length === 0 ? (
            <p className="no-results">Nessuna playlist trovata</p>
          ) : (
            filteredPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="playlist-card"
                onClick={() => handlePlaylistClick(playlist)}
              >
                {playlist.images && playlist.images.length > 0 ? (
                  <img
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    className="playlist-cover"
                  />
                ) : (
                  <div className="playlist-cover-placeholder">🎵</div>
                )}
                <div className="playlist-info">
                  <h3 className="playlist-name">{playlist.name}</h3>
                  <p className="playlist-tracks-count">
                    {playlist.tracks.total} {playlist.tracks.total === 1 ? 'brano' : 'brani'}
                  </p>
                  {playlist.description && (
                    <p className="playlist-description">{playlist.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Lista tracce */}
      {selectedPlaylist && showTracks ? (
        <div className="tracks-list">
          {isLoadingTracks ? (
            <div className="tracks-loading">Caricamento tracce...</div>
          ) : filteredTracks.length === 0 ? (
            <p className="no-results">Nessuna traccia trovata</p>
          ) : (
            filteredTracks.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className="track-item"
                onClick={() => handleTrackClick(track)}
              >
                <div className="track-number">{index + 1}</div>
                {track.album.images && track.album.images.length > 0 && (
                  <img
                    src={track.album.images[track.album.images.length - 1].url}
                    alt={track.album.name}
                    className="track-cover-small"
                  />
                )}
                <div className="track-info">
                  <h4 className="track-title">{track.name}</h4>
                  <p className="track-artist">
                    {track.artists.map(artist => artist.name).join(', ')}
                  </p>
                </div>
                <div className="track-duration">
                  {Math.floor(track.duration_ms / 60000)}:
                  {Math.floor((track.duration_ms % 60000) / 1000)
                    .toString()
                    .padStart(2, '0')}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Statistiche playlist */}
      {!selectedPlaylist && (
        <div className="selector-stats">
          <p>
            {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlist'} totali
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaylistSelector;
