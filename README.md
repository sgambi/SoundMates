# 🎵 SoundMates

Una web app musicale per giocare a giochi interattivi utilizzando le API di Spotify. Scopri nuova musica, sfida i tuoi amici e testa le tue conoscenze musicali!

![Spotify](https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Caratteristiche

- 🎮 **Giochi Musicali Interattivi** - Music Quiz, Match Musicale, e altro
- 🎵 **Player Spotify Completo** - Controlla la tua musica direttamente dall'app (richiede Premium)
- 📚 **Gestione Playlist** - Visualizza, esplora e analizza le tue playlist Spotify
- 📊 **Analisi Audio** - Statistiche dettagliate su danceability, energy, valence e altro
- 🔐 **Login Sicuro** - Autenticazione OAuth tramite Spotify
- 📱 **Responsive Design** - Funziona perfettamente su desktop e mobile

## 🚀 Demo

Prova l'app live: [https://sgambi.github.io/SoundMates](https://sgambi.github.io/SoundMates)

## 📋 Prerequisiti

- Node.js (v18 o superiore)
- Un account Spotify (Premium per le funzionalità di playback)
- Spotify Developer App configurata

## 🛠️ Setup Locale

### 1. Clona il repository

```bash
git clone https://github.com/sgambi/SoundMates.git
cd SoundMates
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

Crea un file `.env` nella root del progetto:

```env
VITE_SPOTIFY_CLIENT_ID=il_tuo_client_id_spotify
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
```

**Come ottenere le credenziali Spotify:**

1. Vai su [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nuova app
3. Copia il **Client ID**
4. Aggiungi `http://localhost:5173/callback` come **Redirect URI** nelle impostazioni dell'app

### 4. Avvia il server di sviluppo

```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

## 🏗️ Build per Produzione

```bash
npm run build
npm run preview  # Per testare la build locale
```

I file compilati saranno nella cartella `dist/`.

## 📁 Struttura del Progetto

```
SoundMates/
├── src/
│   ├── components/          # Componenti React riutilizzabili
│   │   ├── SpotifyPlayer.tsx
│   │   ├── PlaylistSelector.tsx
│   │   └── ProtectedRoute.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useSpotifyPlayer.ts
│   │   └── usePlaylistAnalysis.ts
│   ├── pages/              # Pagine dell'applicazione
│   │   ├── Login.tsx
│   │   ├── Callback.tsx
│   │   └── Dashboard.tsx
│   ├── services/           # Servizi API
│   │   └── spotifyApi.ts
│   ├── types/              # TypeScript types
│   │   └── spotify.ts
│   ├── config/             # Configurazione
│   │   └── spotify.ts
│   ├── utils/              # Utility functions
│   │   └── auth.ts
│   └── styles/             # File CSS
├── public/                 # Asset statici
└── TOOLS_README.md        # Documentazione tecnica dettagliata
```

## 🎮 Funzionalità Principali

### Player Spotify

Controllo completo della riproduzione Spotify:
- ▶️ Play/Pause
- ⏭️ Skip tracce
- 🔀 Shuffle
- 🔁 Repeat
- 🔊 Controllo volume
- 📊 Progress bar con seek

**Nota:** Richiede Spotify Premium

### Gestione Playlist

- Visualizza tutte le tue playlist
- Esplora le tracce di ogni playlist
- Ricerca playlist e brani
- Statistiche dettagliate

### Analisi Audio

Analizza le caratteristiche audio delle tue playlist:
- **Danceability** - Quanto è ballabile
- **Energy** - Intensità e attività
- **Valence** - Positività (felice vs triste)
- **Tempo** - BPM
- Top artisti e statistiche

## 🔧 Tecnologie Utilizzate

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool veloce
- **React Router** - Routing
- **Spotify Web API** - Integrazione musicale
- **GitHub Pages** - Hosting

## 📖 Documentazione

Per documentazione tecnica dettagliata sui tool e le API, consulta [TOOLS_README.md](TOOLS_README.md)

## 🤝 Contribuire

I contributi sono benvenuti! Sentiti libero di:

1. Fork il progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Roadmap

- [ ] Music Quiz - Indovina il brano
- [ ] Match Musicale - Compatibilità con amici
- [ ] Artisti Mystery - Indovina l'artista
- [ ] Classifiche e punteggi
- [ ] Modalità multiplayer
- [ ] Integrazione con altre piattaforme musicali

## ⚠️ Note Importanti

- Le funzionalità di playback richiedono **Spotify Premium**
- L'app richiede permessi per accedere ai tuoi dati Spotify
- I token di autenticazione sono salvati localmente nel browser
- Assicurati di avere un dispositivo Spotify attivo per usare il player

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 👤 Autore

**Salvatore Gambitta**

- GitHub: [@sgambi](https://github.com/sgambi)

## 🙏 Ringraziamenti

- [Spotify Web API](https://developer.spotify.com/documentation/web-api) per le fantastiche API
- [Vite](https://vitejs.dev/) per il tool di build velocissimo
- Community React per il supporto

---

**Made with ❤️ and 🎵**
