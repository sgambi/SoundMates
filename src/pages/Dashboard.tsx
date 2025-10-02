import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, clearToken } from '../utils/auth';
import { spotifyApi } from '../services/spotifyApi';
import type { SpotifyPlaylist, SpotifyUser } from '../types/spotify';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'playlists'>('games');
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);

  useEffect(() => {
    // Verifica autenticazione
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }

    // Carica i dati dell'utente e le playlist
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      // Carica profilo utente
      const userData = await spotifyApi.getCurrentUser();
      setUser(userData);

      // Carica playlist
      setLoadingPlaylists(true);
      const playlistsData = await spotifyApi.getAllUserPlaylists();
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      // Se il token è scaduto, effettua il logout
      handleLogout();
    } finally {
      setLoading(false);
      setLoadingPlaylists(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <h1>SoundMates</h1>
        </div>
        <div className="dashboard-user">
          {user && (
            <>
              {user.images && user.images.length > 0 && (
                <img
                  src={user.images[0].url}
                  alt={user.display_name}
                  className="user-avatar"
                />
              )}
              <span className="user-name">{user.display_name}</span>
            </>
          )}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'games' ? 'active' : ''}`}
            onClick={() => setActiveTab('games')}
          >
            🎮 Giochi
          </button>
          <button
            className={`tab-button ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            📚 Le tue Playlist
          </button>
        </div>

        {/* Contenuto tabs */}
        {activeTab === 'games' && (
          <>
            <div className="welcome-section">
              <h2>Benvenuto{user ? `, ${user.display_name}` : ''}! 🎵</h2>
              <p>Inizia a giocare con la tua musica preferita</p>
            </div>

            <div className="games-grid">
              <div className="game-card">
                <div className="game-icon">🎯</div>
                <h3>Indovina la Canzone</h3>
                <p>Indovina il brano dai primi secondi</p>
                <button
                  className="game-button"
                  onClick={() => navigate('/game/guess-song')}
                >
                  Gioca
                </button>
              </div>

              <div className="game-card">
                <div className="game-icon">🤝</div>
                <h3>Match Musicale</h3>
                <p>Scopri la compatibilità con i tuoi amici</p>
                <button className="game-button" disabled>
                  Prossimamente
                </button>
              </div>

              <div className="game-card">
                <div className="game-icon">🏆</div>
                <h3>Classifiche</h3>
                <p>Vedi le tue statistiche e i punteggi</p>
                <button className="game-button" disabled>
                  Prossimamente
                </button>
              </div>

              <div className="game-card">
                <div className="game-icon">🎸</div>
                <h3>Artisti Mystery</h3>
                <p>Indovina l'artista dalle sue canzoni</p>
                <button className="game-button" disabled>
                  Prossimamente
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'playlists' && (
          <div className="playlists-tab">
            <h2>Le tue Playlist</h2>
            <p className="tab-description">
              {loadingPlaylists ? 'Caricamento playlist...' : `${playlists.length} playlist trovate`}
            </p>

            {!loadingPlaylists && playlists.length > 0 && (
              <div className="playlists-grid">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="playlist-card"
                    onClick={() => setSelectedPlaylist(playlist)}
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
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPlaylist && (
              <div className="playlist-details">
                <h3>Playlist selezionata: {selectedPlaylist.name}</h3>
                <p>{selectedPlaylist.tracks.total} brani</p>
                <button onClick={() => setSelectedPlaylist(null)}>Chiudi</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
