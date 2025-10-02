import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import { spotifyApi } from '../services/spotifyApi';
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify';
import '../styles/GuessSongGame.css';

interface GameQuestion {
  correctTrack: SpotifyTrack;
  options: SpotifyTrack[];
}

const GuessSongGame = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingGame, setLoadingGame] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const TOTAL_QUESTIONS = 10;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }
    loadPlaylists();

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [navigate]);

  const loadPlaylists = async () => {
    try {
      const data = await spotifyApi.getAllUserPlaylists();
      // Filtra solo playlist con almeno 10 canzoni
      const validPlaylists = data.filter(p => p.tracks.total >= 10);
      setPlaylists(validPlaylists);
    } catch (error) {
      console.error('Errore nel caricamento delle playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    setLoadingGame(true);

    try {
      const tracks = await spotifyApi.getAllPlaylistTracks(playlist.id);
      // Filtra solo tracce con preview disponibile
      const tracksWithPreview = tracks.filter(t => t.preview_url);

      if (tracksWithPreview.length < 10) {
        alert('Questa playlist non ha abbastanza brani con anteprima disponibile. Scegline un\'altra.');
        setLoadingGame(false);
        return;
      }

      // Genera la prima domanda
      generateQuestion(tracksWithPreview, 0);
      setGameStarted(true);
    } catch (error) {
      console.error('Errore nell\'avvio del gioco:', error);
      alert('Errore nel caricamento della playlist');
    } finally {
      setLoadingGame(false);
    }
  };

  const generateQuestion = (tracks: SpotifyTrack[], questionIndex: number) => {
    // Seleziona una traccia casuale come risposta corretta
    const correctTrack = tracks[Math.floor(Math.random() * tracks.length)];

    // Genera 3 opzioni sbagliate diverse dalla risposta corretta
    const wrongOptions: SpotifyTrack[] = [];
    while (wrongOptions.length < 3) {
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      if (randomTrack.id !== correctTrack.id && !wrongOptions.find(t => t.id === randomTrack.id)) {
        wrongOptions.push(randomTrack);
      }
    }

    // Mescola le opzioni
    const options = [correctTrack, ...wrongOptions].sort(() => Math.random() - 0.5);

    setCurrentQuestion({ correctTrack, options });
    setCurrentQuestionIndex(questionIndex);
    setSelectedAnswer(null);
    setShowCorrectAnswer(false);

    // Riproduci l'anteprima
    playPreview(correctTrack.preview_url!);
  };

  const playPreview = (previewUrl: string) => {
    if (audio) {
      audio.pause();
    }

    const newAudio = new Audio(previewUrl);
    newAudio.volume = 0.5;
    newAudio.play();
    setAudio(newAudio);
  };

  const handleAnswer = async (selectedTrack: SpotifyTrack) => {
    if (selectedAnswer) return; // Previeni risposte multiple

    setSelectedAnswer(selectedTrack.id);
    setShowCorrectAnswer(true);

    // Ferma l'audio
    if (audio) {
      audio.pause();
    }

    // Aggiorna il punteggio
    if (selectedTrack.id === currentQuestion?.correctTrack.id) {
      setScore(score + 1);
    }

    // Passa alla prossima domanda dopo 2 secondi
    setTimeout(async () => {
      if (currentQuestionIndex + 1 < TOTAL_QUESTIONS) {
        // Ricarica le tracce per la prossima domanda
        const tracks = await spotifyApi.getAllPlaylistTracks(selectedPlaylist!.id);
        const tracksWithPreview = tracks.filter(t => t.preview_url);
        generateQuestion(tracksWithPreview, currentQuestionIndex + 1);
      } else {
        // Fine del gioco
        setGameOver(true);
        setGameStarted(false);
      }
    }, 2000);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedPlaylist(null);
    setCurrentQuestion(null);
    if (audio) {
      audio.pause();
      audio.src = '';
    }
  };

  if (loading) {
    return (
      <div className="game-container">
        <div className="game-loading">Caricamento...</div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="game-container">
        <div className="game-over">
          <h2>Gioco Terminato!</h2>
          <div className="final-score">
            <p>Il tuo punteggio:</p>
            <h1>{score} / {TOTAL_QUESTIONS}</h1>
            <p className="score-percentage">
              {Math.round((score / TOTAL_QUESTIONS) * 100)}%
            </p>
          </div>
          <div className="game-over-actions">
            <button onClick={resetGame} className="btn-primary">
              Gioca Ancora
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="game-container">
        <div className="game-setup">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Indietro
          </button>

          <h1>Indovina la Canzone</h1>
          <p className="game-description">
            Ascolta l'anteprima e indovina il brano corretto!
          </p>

          <div className="playlist-selection">
            <h2>Seleziona una Playlist</h2>
            {playlists.length === 0 ? (
              <p>Nessuna playlist disponibile con almeno 10 brani</p>
            ) : (
              <div className="playlists-grid">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="playlist-card"
                    onClick={() => !loadingGame && startGame(playlist)}
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
                      <h3>{playlist.name}</h3>
                      <p>{playlist.tracks.total} brani</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loadingGame && <div className="loading-game">Caricamento gioco...</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <button onClick={resetGame} className="back-button">
          ← Esci
        </button>
        <div className="game-progress">
          <span>Domanda {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}</span>
          <span>Punteggio: {score}</span>
        </div>
      </div>

      {currentQuestion && (
        <div className="game-question">
          <div className="audio-player">
            <div className="audio-visualizer">
              <div className="audio-icon">🎵</div>
              <p>Ascolta l'anteprima...</p>
            </div>
            <button
              onClick={() => audio?.play()}
              className="replay-button"
              disabled={showCorrectAnswer}
            >
              🔄 Riascolta
            </button>
          </div>

          <h2>Quale canzone è?</h2>

          <div className="answers-grid">
            {currentQuestion.options.map((track) => {
              const isCorrect = track.id === currentQuestion.correctTrack.id;
              const isSelected = selectedAnswer === track.id;

              let className = 'answer-option';
              if (showCorrectAnswer) {
                if (isCorrect) className += ' correct';
                else if (isSelected) className += ' wrong';
              }

              return (
                <button
                  key={track.id}
                  className={className}
                  onClick={() => handleAnswer(track)}
                  disabled={showCorrectAnswer}
                >
                  <div className="track-info">
                    <h3>{track.name}</h3>
                    <p>{track.artists.map(a => a.name).join(', ')}</p>
                  </div>
                  {track.album.images && track.album.images.length > 0 && (
                    <img
                      src={track.album.images[track.album.images.length - 1].url}
                      alt={track.album.name}
                      className="track-thumbnail"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuessSongGame;
