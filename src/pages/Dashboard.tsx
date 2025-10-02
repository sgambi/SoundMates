import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, clearToken, getToken } from '../utils/auth';
import SpotifyPlayer from '../components/SpotifyPlayer';
import PlaylistSelector from '../components/PlaylistSelector';
import type { SpotifyPlaylist } from '../types/spotify';
import '../styles/Dashboard.css';

interface UserProfile {
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'games' | 'player' | 'playlists'>('games');
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);

  useEffect(() => {
    // Verifica autenticazione
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }

    // Carica i dati dell'utente
    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token non valido o scaduto
        handleLogout();
      }
    } catch (error) {
      console.error('Errore nel caricamento del profilo:', error);
    } finally {
      setLoading(false);
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
            className={`tab-button ${activeTab === 'player' ? 'active' : ''}`}
            onClick={() => setActiveTab('player')}
          >
            🎵 Player
          </button>
          <button
            className={`tab-button ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            📚 Playlist
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
                <h3>Music Quiz</h3>
                <p>Indovina il brano dai primi secondi</p>
                <button className="game-button" disabled>
                  Prossimamente
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

        {activeTab === 'player' && (
          <div className="player-tab">
            <h2>Spotify Player</h2>
            <p className="tab-description">
              Controlla la tua musica direttamente da qui. Richiede Spotify Premium.
            </p>
            <SpotifyPlayer />
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="playlists-tab">
            <h2>Le tue Playlist</h2>
            <p className="tab-description">
              Esplora e analizza le tue playlist Spotify
            </p>
            <PlaylistSelector
              onPlaylistSelect={(playlist) => setSelectedPlaylist(playlist)}
              showTracks={true}
            />
            {selectedPlaylist && (
              <div className="playlist-details">
                <h3>Playlist selezionata: {selectedPlaylist.name}</h3>
                <p>{selectedPlaylist.tracks.total} brani</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
