// Configurazione Spotify OAuth
export const SPOTIFY_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
  REDIRECT_URI: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback',
  AUTH_ENDPOINT: 'https://accounts.spotify.com/authorize',
  SCOPES: [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-recently-played',
  ],
};

export const getSpotifyAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    response_type: 'token',
    redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
    scope: SPOTIFY_CONFIG.SCOPES.join(' '),
    show_dialog: 'true',
  });

  return `${SPOTIFY_CONFIG.AUTH_ENDPOINT}?${params.toString()}`;
};
