import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, clearToken, getToken } from '../utils/auth';
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
      </main>
    </div>
  );
};

export default Dashboard;
