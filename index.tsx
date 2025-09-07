import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

const clientId = "6e8148d1722e4f50a82d4daad89203f3";
const redirectUri = "https://soundmates-649582493706.us-west1.run.app/";
const fixedPlaylistIds = ['3KoGQhO5DBWhtJqcwDx0iW'];

// Helper functions
const generateCodeVerifier = (length: number) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const generateCodeChallenge = async (codeVerifier: string) => {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};


const App = () => {
  // State management for the application flow
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("spotify_access_token"));
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState(accessToken ? 'gameMode' : 'login'); // 'login', 'gameMode', 'playlist', 'gameSetup', 'player'
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Game state
  const [players, setPlayers] = useState([{ id: 1, name: '', score: 0, playlists: [] as string[] }]);
  const [gameTracks, setGameTracks] = useState<any[]>([]);
  const [fullTrackPool, setFullTrackPool] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [answerOptions, setAnswerOptions] = useState<string[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      const verifier = localStorage.getItem("spotify_code_verifier");
      if (verifier) {
          getAccessToken(code, verifier);
      }
    }
  }, []);

  useEffect(() => {
      if (accessToken) {
          setCurrentView('gameMode');
          fetchPlaylists();
          fetchUserProfile();
      } else {
          setCurrentView('login');
          setUserProfile(null);
      }
  }, [accessToken]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getAccessToken = async (code: string, verifier: string) => {
      const payload = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
              client_id: clientId,
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirectUri,
              code_verifier: verifier,
          }),
      };
      try {
          const result = await fetch("https://accounts.spotify.com/api/token", payload);
          const { access_token } = await result.json();
          if (access_token) {
              localStorage.setItem("spotify_access_token", access_token);
              setAccessToken(access_token);
              window.history.pushState({}, '', redirectUri); // Clear params from URL
          }
      } catch (e) {
          console.error(e);
      }
  };
  
  const handleLoginSpotify = async () => {
      const verifier = generateCodeVerifier(128);
      const challenge = await generateCodeChallenge(verifier);
      localStorage.setItem("spotify_code_verifier", verifier);
      const scope = "playlist-read-private playlist-read-collaborative user-read-private";
      const authUrl = new URL("https://accounts.spotify.com/authorize");
      authUrl.search = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          scope,
          redirect_uri: redirectUri,
          code_challenge_method: 'S256',
          code_challenge: challenge,
      }).toString();
      window.location.href = authUrl.toString();
  };
  
  const handleLogout = () => {
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_code_verifier");
      setAccessToken(null);
      
      // Reset all game state
      setCurrentView('login');
      setSelectedGameMode(null);
      setSelectedPlaylists([]);
      setPlaylists([]);
      setPlayers([{ id: 1, name: '', score: 0, playlists: [] as string[] }]);
      setGameTracks([]);
      setFullTrackPool([]);
      setCurrentTrack(null);
      setCurrentTurn(0);
      setAnswerOptions([]);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsProfileMenuOpen(false);
  };
  
  const fetchUserProfile = async () => {
    if (!accessToken) return;
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        setUserProfile(data);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        // Could handle token expiry here by logging out
        handleLogout();
    }
  };

  const fetchPlaylists = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
        const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        const userPlaylists = data.items || [];
        
        const fixedPlaylistPromises = fixedPlaylistIds.map(id =>
            fetch(`https://api.spotify.com/v1/playlists/${id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            }).then(res => res.json())
        );
        
        const fixedPlaylists = await Promise.all(fixedPlaylistPromises);
        
        const combined = [...fixedPlaylists, ...userPlaylists];
        
        const uniquePlaylists = Array.from(new Map(combined.map(p => [p.id, p])).values());
        
        setPlaylists(uniquePlaylists);
    } catch (error) {
        console.error('Error fetching playlists:', error);
    } finally {
        setIsLoading(false);
    }
  };
  
  const setupNewRound = (tracks: any[], allTracks: any[]) => {
    if (tracks.length === 0) {
        // Handle game over
        setCurrentTrack(null);
        return;
    }
    
    const newTrack = tracks[0];
    const remainingTracks = tracks.slice(1);

    // Create answer options
    const correctOption = newTrack.track.name;
    const incorrectOptions = allTracks
        .filter(t => t.track.id !== newTrack.track.id)
        .map(t => t.track.name);
    
    const uniqueIncorrectOptions = Array.from(new Set(incorrectOptions));
    const shuffledIncorrect = shuffleArray(uniqueIncorrectOptions).slice(0, 5);

    const options = shuffleArray([correctOption, ...shuffledIncorrect]);

    setCurrentTrack(newTrack);
    setGameTracks(remainingTracks);
    setAnswerOptions(options);
    setHasAnswered(false);
    setSelectedAnswer(null);

    if (audioRef.current) {
        audioRef.current.pause();
    }
    if (newTrack.track.preview_url) {
        const newAudio = new Audio(newTrack.track.preview_url);
        newAudio.addEventListener('ended', () => setIsPlaying(false));
        audioRef.current = newAudio;
    } else {
        // Skip track if no preview
        setupNewRound(remainingTracks, allTracks);
    }
  };
  
  const handleStartGame = async () => {
    setIsLoading(true);
    const playerPlaylists = players.flatMap(p => p.playlists);
    const uniquePlaylistIds = Array.from(new Set(playerPlaylists));

    try {
        const trackPromises = uniquePlaylistIds.map(id =>
            fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            }).then(res => res.json())
        );

        const playlistsTracksData = await Promise.all(trackPromises);
        const allTracks = playlistsTracksData
            .flatMap(data => data.items)
            .filter(item => item && item.track && item.track.preview_url);

        const uniqueTracks = Array.from(new Map(allTracks.map(item => [item.track.id, item])).values());
        const shuffledTracks = shuffleArray(uniqueTracks);
        
        setFullTrackPool([...shuffledTracks]);
        setupNewRound(shuffledTracks, shuffledTracks);
        
        setCurrentView('player');

    } catch (error) {
        console.error('Error fetching tracks:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered) return;

    setIsPlaying(false);
    audioRef.current?.pause();
    setHasAnswered(true);
    setSelectedAnswer(answer);

    if (answer === currentTrack.track.name) {
        const updatedPlayers = [...players];
        updatedPlayers[currentTurn].score += 1;
        setPlayers(updatedPlayers);
    }

    setTimeout(() => {
        setCurrentTurn(prev => (prev + 1) % players.length);
        setupNewRound(gameTracks, fullTrackPool);
    }, 2000); // 2-second delay to show result
  };


  // Handlers for user actions
  const handleSelectGameMode = (mode: string) => {
    setSelectedGameMode(mode);
    setCurrentView('playlist');
  };

  const handlePlaylistSelection = (playlistId: string) => {
    setSelectedPlaylists(prev => 
      prev.includes(playlistId) 
        ? prev.filter(id => id !== playlistId) 
        : [...prev, playlistId]
    );
  };

  const handleGoToGameSetup = () => {
    if (selectedPlaylists.length > 0) {
      // Initialize players with all selected playlists by default
      const initialPlayers = players.map(p => ({
          ...p,
          playlists: [...selectedPlaylists]
      }));
      setPlayers(initialPlayers);
      setCurrentView('gameSetup');
    }
  };
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
    }
  };
  
  const handleNumberOfPlayersChange = (num: number) => {
      const newNum = Math.max(1, Math.min(6, num));
      const currentPlayers = [...players];
      const diff = newNum - currentPlayers.length;
      if (diff > 0) {
          for (let i = 0; i < diff; i++) {
              currentPlayers.push({ id: Date.now() + i, name: '', score: 0, playlists: [...selectedPlaylists] });
          }
      } else if (diff < 0) {
          currentPlayers.splice(newNum);
      }
      setPlayers(currentPlayers);
  };
  
  const handlePlayerInfoChange = (index: number, field: 'name' | 'playlists', value: string | string[]) => {
      const updatedPlayers = [...players];
      if (field === 'name') {
        updatedPlayers[index].name = value as string;
      } else if (field === 'playlists') {
         const playlistId = value as string;
         const playerPlaylists = updatedPlayers[index].playlists;
         if (playerPlaylists.includes(playlistId)) {
             updatedPlayers[index].playlists = playerPlaylists.filter(id => id !== playlistId);
         } else {
             updatedPlayers[index].playlists.push(playlistId);
         }
      }
      setPlayers(updatedPlayers);
  };

  // Render functions
  const renderUserProfileMenu = () => {
    if (!userProfile) return null;

    return (
      <div className="user-profile-container" ref={profileMenuRef}>
        <button className="user-profile-btn" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} aria-haspopup="true" aria-expanded={isProfileMenuOpen} aria-label="User menu">
          {(userProfile.images && userProfile.images.length > 0 && userProfile.images[0].url) ? (
            <img src={userProfile.images[0].url} alt="User profile" className="user-avatar" />
          ) : (
            <UserIcon />
          )}
        </button>
        {isProfileMenuOpen && (
          <div className="profile-menu" role="menu">
            <div className="profile-menu-header">
              <span>Logged in as</span>
              <strong>{userProfile.display_name}</strong>
            </div>
            <button className="btn-logout" onClick={handleLogout} role="menuitem">
              Logout
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGameModeSelection = () => (
    <div className="card" aria-labelledby="gamemode-heading">
      <h2 id="gamemode-heading">Scegli la modalità</h2>
      <div className="game-mode-options">
        <button className="game-mode-card" onClick={() => handleSelectGameMode('guess-title')}>
          <h3>Indovina il Titolo</h3>
          <p>Ascolta un'anteprima e indovina il titolo della canzone.</p>
        </button>
      </div>
    </div>
  );
  
  const renderPlaylistSelection = () => (
    <div className="card" aria-labelledby="playlist-heading">
      <h2 id="playlist-heading">Playlist da integrare</h2>
      <p>Seleziona le playlist che vuoi usare in questa partita.</p>
        <div className="playlist-list">
          {playlists.map(playlist => (
            <label key={playlist.id} className="playlist-item">
              <input 
                type="checkbox"
                checked={selectedPlaylists.includes(playlist.id)}
                onChange={() => handlePlaylistSelection(playlist.id)}
              />
              <span className="checkbox-custom"></span>
              {playlist.images && playlist.images.length > 0 ? (
                <img src={playlist.images[0].url} alt={playlist.name} className="playlist-cover" />
              ) : (
                <div className="playlist-cover-placeholder"><MusicNoteIcon /></div>
              )}
              <div className="playlist-info">
                <strong>{playlist.name}</strong>
                <small>{playlist.owner.display_name}</small>
              </div>
            </label>
          ))}
        </div>
        <button 
            className="btn btn-primary" 
            onClick={handleGoToGameSetup}
            disabled={selectedPlaylists.length === 0 || isLoading}
            aria-disabled={selectedPlaylists.length === 0 || isLoading}
        >
            Continua
        </button>
    </div>
  );
  
  const renderGameSetup = () => {
    const selectedPlaylistObjects = playlists.filter(p => selectedPlaylists.includes(p.id));
    const canStart = players.every(p => p.name.trim() !== '' && p.playlists.length > 0);

    return (
        <div className="card" aria-labelledby="setup-heading">
            <h2 id="setup-heading">Configura la Partita</h2>
            <div className="form-group">
                <label htmlFor="num-players">Numero di giocatori (1-6):</label>
                <input
                    type="number"
                    id="num-players"
                    className="input-number"
                    value={players.length}
                    onChange={(e) => handleNumberOfPlayersChange(parseInt(e.target.value, 10))}
                    min="1"
                    max="6"
                />
            </div>

            <div className="players-setup-list">
                {players.map((player, index) => (
                    <div key={player.id} className="player-setup-card">
                        <input
                            type="text"
                            placeholder={`Nome Giocatore ${index + 1}`}
                            className="input-text"
                            value={player.name}
                            onChange={(e) => handlePlayerInfoChange(index, 'name', e.target.value)}
                        />
                        <p className="player-playlist-label">Playlist per {player.name || `Giocatore ${index + 1}`}:</p>
                        <div className="player-playlist-selection">
                            {selectedPlaylistObjects.map(playlist => (
                                <label key={playlist.id} className="playlist-checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={player.playlists.includes(playlist.id)}
                                        onChange={() => handlePlayerInfoChange(index, 'playlists', playlist.id)}
                                    />
                                    <span className="checkbox-custom-small"></span>
                                    {playlist.name}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="btn btn-primary"
                onClick={handleStartGame}
                disabled={!canStart || isLoading}
                aria-disabled={!canStart || isLoading}
            >
                {isLoading ? 'Caricamento...' : 'Inizia a Giocare'}
            </button>
        </div>
    );
  };


  const renderSpotifyLogin = () => (
    <div className="card" aria-labelledby="login-heading">
        <h1 id="login-heading">SoundMates</h1>
        <p>Un party game musicale. Accedi con Spotify per iniziare!</p>
        <button className="btn btn-spotify" onClick={handleLoginSpotify}>
            <SpotifyIcon />
            Accedi con Spotify
        </button>
    </div>
  );

  const renderMusicPlayer = () => {
    if (isLoading) return <div className="card"><p>Caricamento canzoni...</p></div>;
    if (!currentTrack) return <div className="card"><h2>Partita Finita!</h2><p>Grazie per aver giocato.</p></div>;

    return (
        <div className="card player-view" aria-label="Schermata di gioco">
            <div className="player-list">
                {players.map((p, index) => (
                    <div key={p.id} className={`player-display ${index === currentTurn ? 'active' : ''}`}>
                        <span className="player-name">{p.name}</span>
                        <span className="player-score">{p.score}</span>
                    </div>
                ))}
            </div>
            
            <div className="player-content">
                <div className="album-art">
                    {currentTrack.track.album.images.length > 0 ? (
                        <img src={currentTrack.track.album.images[0].url} alt="Album Art"/>
                    ) : (
                        <MusicNoteIcon />
                    )}
                </div>
                <button className="control-btn play-btn" aria-label={isPlaying ? 'Pausa' : 'Play'} onClick={togglePlay} disabled={hasAnswered}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <p className="song-artist">{currentTrack.track.artists.map((a: any) => a.name).join(', ')}</p>
            </div>
            
            <div className="answer-options">
                {answerOptions.map((option, index) => {
                    let btnClass = 'answer-btn';
                    if (hasAnswered) {
                        if (option === currentTrack.track.name) {
                            btnClass += ' correct';
                        } else if (option === selectedAnswer) {
                            btnClass += ' incorrect';
                        }
                    }
                    return (
                        <button key={index} className={btnClass} onClick={() => handleAnswerSelect(option)} disabled={hasAnswered}>
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
  };
  
  const renderContent = () => {
    switch (currentView) {
      case 'gameMode':
        return renderGameModeSelection();
      case 'playlist':
        return renderPlaylistSelection();
      case 'gameSetup':
        return renderGameSetup();
      case 'player':
        return renderMusicPlayer();
      case 'login':
      default:
        return renderSpotifyLogin();
    }
  };

  return (
    <>
      {accessToken && renderUserProfileMenu()}
      <main className="container">
        {renderContent()}
      </main>
    </>
  );
};

// SVG Icons
const SpotifyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm4.125 13.125c-.25.417-1.042.542-1.417.333-2.25-1.333-5.083-1.667-8.417-.917-.417.083-.75-.167-.833-.583-.083-.417.167-.75.583-.833 3.667-.833 6.833-.417 9.417 1.167.333.166.417.666.167 1.083zM17.5 12c-.333.5-.125.75-.667.5-2.583-1.583-6.417-2.083-9.917-1.167-.5.167-.917-.083-1.083-.583-.167-.5.083-.917.583-1.083 3.917-1 8.167-.417 11.167 1.5.416.25.583.833.167 1.333zm.167-2.833c-.334.584-1.167.834-1.75.5-3-1.833-7.917-2.25-11.5-1.25-.583.167-1.167-.167-1.333-.75-.166-.583.167-1.167.75-1.333C7.083 3.333 12.5 3.833 16.083 5.917c.5.25.75.917.417 1.5z"></path></svg>
);
const MusicNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path></svg>
);
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
);
const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#B3B3B3" style={{ backgroundColor: '#282828', borderRadius: '50%', border: '2px solid var(--white)' }}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);