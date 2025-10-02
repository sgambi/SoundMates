# SoundMates - Tool e API Spotify

Documentazione completa dei tool sviluppati per SoundMates, un'applicazione musicale basata su Spotify.

## 📋 Indice

- [Configurazione Spotify](#configurazione-spotify)
- [Servizio API Spotify](#servizio-api-spotify)
- [Player Spotify](#player-spotify)
- [Gestione Playlist](#gestione-playlist)
- [Analisi Playlist](#analisi-playlist)
- [Tipi TypeScript](#tipi-typescript)

---

## 🎵 Configurazione Spotify

### File: `src/config/spotify.ts`

Gestisce la configurazione OAuth di Spotify e gli scopes necessari.

#### Scopes Disponibili

```typescript
- user-read-private          // Profilo utente privato
- user-read-email            // Email utente
- user-top-read              // Top artisti e brani
- user-library-read          // Libreria salvata
- playlist-read-private      // Playlist private
- playlist-read-collaborative // Playlist collaborative
- user-read-recently-played  // Brani recenti
- streaming                  // Playback completo (Premium)
- user-read-playback-state   // Stato playback
- user-modify-playback-state // Controllo playback
- user-read-currently-playing // Brano corrente
```

**Nota:** Le funzionalità di streaming richiedono un account Spotify Premium.

---

## 🔌 Servizio API Spotify

### File: `src/services/spotifyApi.ts`

Classe singleton per gestire tutte le chiamate alle API di Spotify.

### Metodi Disponibili

#### User APIs

```typescript
// Ottiene il profilo dell'utente corrente
await spotifyApi.getCurrentUser();

// Top artisti (timeRange: 'short_term' | 'medium_term' | 'long_term')
await spotifyApi.getTopArtists('medium_term', 20);

// Top brani
await spotifyApi.getTopTracks('medium_term', 20);
```

#### Playlist APIs

```typescript
// Tutte le playlist dell'utente (con paginazione automatica)
const playlists = await spotifyApi.getAllUserPlaylists();

// Dettagli playlist specifica
const playlist = await spotifyApi.getPlaylist(playlistId);

// Tutte le tracce di una playlist
const tracks = await spotifyApi.getAllPlaylistTracks(playlistId);
```

#### Track APIs

```typescript
// Dettagli di una traccia
const track = await spotifyApi.getTrack(trackId);

// Audio features di una traccia (danceability, energy, ecc.)
const features = await spotifyApi.getAudioFeatures(trackId);

// Audio features multiple (fino a 100 tracce)
const multipleFeatures = await spotifyApi.getMultipleAudioFeatures(trackIds);
```

#### Playback APIs (Premium Required)

```typescript
// Stato corrente della riproduzione
const state = await spotifyApi.getPlaybackState();

// Riproduci contesto (playlist/album) o tracce specifiche
await spotifyApi.play(deviceId, 'spotify:playlist:xyz');
await spotifyApi.play(deviceId, undefined, ['spotify:track:abc']);

// Pausa
await spotifyApi.pause(deviceId);

// Skip
await spotifyApi.skipToNext(deviceId);
await spotifyApi.skipToPrevious(deviceId);

// Volume (0-100)
await spotifyApi.setVolume(80, deviceId);

// Shuffle
await spotifyApi.setShuffle(true, deviceId);

// Repeat ('off' | 'track' | 'context')
await spotifyApi.setRepeat('context', deviceId);

// Seek to position (ms)
await spotifyApi.seek(60000, deviceId);
```

#### Search API

```typescript
// Cerca tracce, artisti, album o playlist
const results = await spotifyApi.search(
  'query',
  ['track', 'artist'],
  20
);
```

---

## 🎮 Player Spotify

### Hook: `src/hooks/useSpotifyPlayer.ts`

Hook React per gestire il player Spotify con controllo completo.

#### Utilizzo

```typescript
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

const MyComponent = () => {
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
    refreshState,
  } = useSpotifyPlayer({
    autoConnect: true,
    pollInterval: 3000, // ms
  });

  // playerState contiene:
  // - isPlaying: boolean
  // - currentTrack: SpotifyTrack | null
  // - progressMs: number
  // - durationMs: number
  // - volume: number
  // - shuffle: boolean
  // - repeat: 'off' | 'track' | 'context'
  // - deviceId: string | null
};
```

### Componente: `src/components/SpotifyPlayer.tsx`

Interfaccia UI completa per il player Spotify.

#### Features

- ▶️ Play/Pause
- ⏭️ Skip Next/Previous
- 🔀 Shuffle
- 🔁 Repeat
- 🔊 Controllo volume
- 📊 Progress bar con seek
- 🎨 Copertina e info traccia

#### Utilizzo

```tsx
import SpotifyPlayer from '../components/SpotifyPlayer';

<SpotifyPlayer className="my-player" />
```

---

## 📚 Gestione Playlist

### Componente: `src/components/PlaylistSelector.tsx`

Componente per visualizzare, cercare e selezionare playlist.

#### Props

```typescript
interface PlaylistSelectorProps {
  onPlaylistSelect?: (playlist: SpotifyPlaylist) => void;
  onTrackSelect?: (track: SpotifyTrack) => void;
  showTracks?: boolean;  // Mostra le tracce quando si seleziona una playlist
  className?: string;
}
```

#### Features

- 📋 Griglia playlist con copertine
- 🔍 Ricerca playlist e tracce
- 🎵 Visualizzazione tracce
- 📊 Statistiche playlist
- 🔄 Navigazione back

#### Utilizzo

```tsx
import PlaylistSelector from '../components/PlaylistSelector';

<PlaylistSelector
  onPlaylistSelect={(playlist) => console.log(playlist)}
  onTrackSelect={(track) => console.log(track)}
  showTracks={true}
/>
```

---

## 📊 Analisi Playlist

### Hook: `src/hooks/usePlaylistAnalysis.ts`

Hook per analizzare caratteristiche dettagliate di una playlist.

#### Utilizzo

```typescript
import { usePlaylistAnalysis } from '../hooks/usePlaylistAnalysis';

const MyComponent = () => {
  const { analysis, isAnalyzing, error, analyzePlaylist, reset } =
    usePlaylistAnalysis();

  // Analizza una playlist
  await analyzePlaylist('playlist_id');

  // analysis contiene:
  // - playlist: SpotifyPlaylist
  // - tracks: SpotifyTrack[]
  // - totalTracks: number
  // - totalDuration: number (ms)
  // - audioFeatures: {
  //     avgDanceability, avgEnergy, avgValence, avgTempo,
  //     avgAcousticness, avgInstrumentalness, avgLiveness, avgSpeechiness
  //   }
  // - topArtists: Array<{ artist, count }>
  // - genreDistribution: Array<{ genre, count }>
  // - explicitCount: number
  // - popularityAvg: number
};
```

#### Utility Functions

```typescript
// Descrizione audio features
getAudioFeatureDescription(0.85, 'danceability');
// => "Molto ballabile (85%)"

// Formattazione durata
formatDuration(3600000);
// => "60m" o "1h 0m"
```

### Audio Features Spiegate

- **Danceability** (0-1): Quanto è adatto per ballare
- **Energy** (0-1): Intensità e attività percepita
- **Valence** (0-1): Positività musicale (felice vs triste)
- **Tempo** (BPM): Battiti per minuto
- **Acousticness** (0-1): Quanto è acustica
- **Instrumentalness** (0-1): Assenza di voce
- **Liveness** (0-1): Presenza di pubblico
- **Speechiness** (0-1): Presenza di parlato

---

## 📦 Tipi TypeScript

### File: `src/types/spotify.ts`

Definizioni TypeScript complete per tutte le entità Spotify.

#### Tipi Principali

```typescript
SpotifyTrack         // Brano musicale
SpotifyAlbum         // Album
SpotifyArtist        // Artista
SpotifyPlaylist      // Playlist
SpotifyUser          // Utente
SpotifyPlaybackState // Stato riproduzione
AudioFeatures        // Caratteristiche audio
SpotifyPagingObject<T> // Oggetto paginato generico
```

---

## 🎮 Integrazione nella Dashboard

### File: `src/pages/Dashboard.tsx`

La dashboard integra tutti i tool con un sistema di tabs:

1. **🎮 Giochi**: Sezione giochi (in sviluppo)
2. **🎵 Player**: Player Spotify completo
3. **📚 Playlist**: Visualizzazione e analisi playlist

---

## 🚀 Come Usare i Tool nei Giochi

### Esempio: Music Quiz

```typescript
import { spotifyApi } from '../services/spotifyApi';
import { usePlaylistAnalysis } from '../hooks/usePlaylistAnalysis';

const MusicQuiz = () => {
  const { analyzePlaylist } = usePlaylistAnalysis();

  const startQuiz = async (playlistId: string) => {
    // 1. Ottieni tutte le tracce
    const tracks = await spotifyApi.getAllPlaylistTracks(playlistId);

    // 2. Seleziona tracce casuali
    const randomTracks = shuffleArray(tracks).slice(0, 10);

    // 3. Riproduci preview (30 secondi)
    randomTracks.forEach(track => {
      // track.preview_url contiene l'URL della preview
    });

    // 4. Analizza la playlist per statistiche
    await analyzePlaylist(playlistId);
  };
};
```

### Esempio: Match Musicale

```typescript
const MatchMusicale = () => {
  const compareUsers = async (userId1: string, userId2: string) => {
    // Ottieni top artisti di entrambi
    const user1Artists = await spotifyApi.getTopArtists('long_term', 50);
    const user2Artists = await spotifyApi.getTopArtists('long_term', 50);

    // Calcola similarità
    const commonArtists = findCommonElements(
      user1Artists.items,
      user2Artists.items
    );

    const matchPercentage = (commonArtists.length / 50) * 100;
    return matchPercentage;
  };
};
```

---

## ⚠️ Note Importanti

1. **Spotify Premium**: Le funzionalità di playback completo richiedono Premium
2. **Rate Limiting**: Spotify ha limiti di rate, implementa retry logic se necessario
3. **Token Expiry**: I token scadono, gestisci il refresh automatico
4. **Device ID**: Per il playback serve un device Spotify attivo
5. **Preview URL**: Può essere `null` per alcune tracce

---

## 🔧 Troubleshooting

### Player non funziona
- Verifica account Premium
- Controlla che ci sia un device attivo
- Verifica gli scopes nell'autenticazione

### Playlist vuote
- Controlla gli scopes `playlist-read-private`
- Verifica che l'utente abbia playlist

### Audio Features mancanti
- Alcune tracce potrebbero non avere audio features
- Filtra i valori `null` nel risultato

---

## 📚 Risorse Utili

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [Audio Features Reference](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)

---

**Sviluppato per SoundMates** 🎵
