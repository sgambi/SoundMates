# Guida alla Configurazione di SoundMates

## 1. Configurazione Spotify Developer

1. Vai su [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nuova applicazione o seleziona quella esistente
3. Nelle impostazioni dell'app, aggiungi questi **Redirect URIs**:
   - `http://localhost:5173/callback` (per sviluppo locale)
   - `https://sgambi.github.io/SoundMates/callback` (per GitHub Pages)
4. Salva le modifiche
5. Copia il **Client ID** dalla dashboard

## 2. Configurazione Locale (.env)

Crea un file `.env` nella root del progetto (se non esiste già):

```env
VITE_SPOTIFY_CLIENT_ID=il_tuo_client_id_qui
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
```

## 3. Configurazione GitHub Secrets

Per il deploy su GitHub Pages, devi configurare i secrets nel repository:

1. Vai su: `https://github.com/sgambi/SoundMates/settings/secrets/actions`
2. Clicca su "New repository secret"
3. Aggiungi questi due secrets:

**Secret 1:**
- Name: `VITE_SPOTIFY_CLIENT_ID`
- Value: `il_tuo_client_id_qui` (lo stesso della dashboard Spotify)

**Secret 2:**
- Name: `VITE_SPOTIFY_REDIRECT_URI`
- Value: `https://sgambi.github.io/SoundMates/callback`

⚠️ **IMPORTANTE**: Il redirect URI su GitHub Pages DEVE essere quello di produzione, non localhost!

## 4. Test

### Test Locale
```bash
npm install
npm run dev
```
Apri `http://localhost:5173` e prova il login

### Test su GitHub Pages
1. Fai un commit e push
2. Aspetta che la GitHub Action completi il deploy
3. Apri `https://sgambi.github.io/SoundMates/`
4. Prova il login con Spotify

## Troubleshooting

### Errore: "Missing required parameter: client_id"
- Verifica che i GitHub Secrets siano configurati correttamente
- Controlla che i nomi dei secrets siano esatti (case-sensitive)
- Aspetta che la GitHub Action ribuildi il progetto dopo aver aggiunto i secrets

### Errore: "INVALID_CLIENT: Invalid redirect URI"
- Verifica che il redirect URI sia registrato nella Spotify Dashboard
- Controlla che il secret `VITE_SPOTIFY_REDIRECT_URI` corrisponda esattamente a quello registrato

### La pagina è bianca su GitHub Pages
- Controlla che il `basename="/SoundMates"` sia configurato in App.tsx
- Verifica che il `base: '/SoundMates/'` sia configurato in vite.config.ts
