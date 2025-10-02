import { getToken } from '../utils/auth';
import type {
  SpotifyPlaylist,
  SpotifyPlaylistTrack,
  SpotifyTrack,
  SpotifyUser,
  SpotifyPlaybackState,
  SpotifyPagingObject,
  AudioFeatures,
  SpotifyArtist,
} from '../types/spotify';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Classe per gestire tutte le chiamate API a Spotify
 */
class SpotifyApiService {
  private getHeaders(): HeadersInit {
    const token = getToken();
    if (!token) {
      throw new Error('Token di autenticazione non disponibile');
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // ========== USER APIs ==========

  /**
   * Ottiene il profilo dell'utente corrente
   */
  async getCurrentUser(): Promise<SpotifyUser> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<SpotifyUser>(response);
  }

  /**
   * Ottiene i top artisti dell'utente
   */
  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20): Promise<SpotifyPagingObject<SpotifyArtist>> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<SpotifyPagingObject<SpotifyArtist>>(response);
  }

  /**
   * Ottiene i top brani dell'utente
   */
  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20): Promise<SpotifyPagingObject<SpotifyTrack>> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<SpotifyPagingObject<SpotifyTrack>>(response);
  }

  // ========== PLAYLIST APIs ==========

  /**
   * Ottiene tutte le playlist dell'utente
   */
  async getUserPlaylists(limit = 50, offset = 0): Promise<SpotifyPagingObject<SpotifyPlaylist>> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/playlists?limit=${limit}&offset=${offset}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<SpotifyPagingObject<SpotifyPlaylist>>(response);
  }

  /**
   * Ottiene tutte le playlist dell'utente (carica tutte le pagine)
   */
  async getAllUserPlaylists(): Promise<SpotifyPlaylist[]> {
    const playlists: SpotifyPlaylist[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getUserPlaylists(limit, offset);
      playlists.push(...response.items);
      hasMore = response.next !== null;
      offset += limit;
    }

    return playlists;
  }

  /**
   * Ottiene i dettagli di una playlist specifica
   */
  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<SpotifyPlaylist>(response);
  }

  /**
   * Ottiene le tracce di una playlist
   */
  async getPlaylistTracks(playlistId: string, limit = 100, offset = 0): Promise<SpotifyPagingObject<SpotifyPlaylistTrack>> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<SpotifyPagingObject<SpotifyPlaylistTrack>>(response);
  }

  /**
   * Ottiene tutte le tracce di una playlist (carica tutte le pagine)
   */
  async getAllPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getPlaylistTracks(playlistId, limit, offset);
      tracks.push(...response.items.map(item => item.track));
      hasMore = response.next !== null;
      offset += limit;
    }

    return tracks;
  }

  // ========== TRACK APIs ==========

  /**
   * Ottiene i dettagli di una traccia
   */
  async getTrack(trackId: string): Promise<SpotifyTrack> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/tracks/${trackId}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<SpotifyTrack>(response);
  }

  /**
   * Ottiene i dettagli di più tracce
   */
  async getTracks(trackIds: string[]): Promise<{ tracks: SpotifyTrack[] }> {
    const ids = trackIds.join(',');
    const response = await fetch(
      `${SPOTIFY_API_BASE}/tracks?ids=${ids}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<{ tracks: SpotifyTrack[] }>(response);
  }

  /**
   * Ottiene le audio features di una traccia
   */
  async getAudioFeatures(trackId: string): Promise<AudioFeatures> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/audio-features/${trackId}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<AudioFeatures>(response);
  }

  /**
   * Ottiene le audio features di più tracce
   */
  async getMultipleAudioFeatures(trackIds: string[]): Promise<{ audio_features: AudioFeatures[] }> {
    const ids = trackIds.join(',');
    const response = await fetch(
      `${SPOTIFY_API_BASE}/audio-features?ids=${ids}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse<{ audio_features: AudioFeatures[] }>(response);
  }

  // ========== PLAYBACK APIs (richiede Spotify Premium) ==========

  /**
   * Ottiene lo stato corrente della riproduzione
   */
  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/player`,
      { headers: this.getHeaders() }
    );
    if (response.status === 204) {
      return null; // Nessun device attivo
    }
    return this.handleResponse<SpotifyPlaybackState>(response);
  }

  /**
   * Ottiene la traccia attualmente in riproduzione
   */
  async getCurrentlyPlaying(): Promise<SpotifyPlaybackState | null> {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/player/currently-playing`,
      { headers: this.getHeaders() }
    );
    if (response.status === 204) {
      return null;
    }
    return this.handleResponse<SpotifyPlaybackState>(response);
  }

  /**
   * Avvia o riprende la riproduzione
   */
  async play(deviceId?: string, contextUri?: string, uris?: string[], offset?: number): Promise<void> {
    const body: Record<string, unknown> = {};
    if (contextUri) body.context_uri = contextUri;
    if (uris) body.uris = uris;
    if (offset !== undefined) body.offset = { position: offset };

    const url = deviceId
      ? `${SPOTIFY_API_BASE}/me/player/play?device_id=${deviceId}`
      : `${SPOTIFY_API_BASE}/me/player/play`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Errore nella riproduzione: ${response.status}`);
    }
  }

  /**
   * Mette in pausa la riproduzione
   */
  async pause(deviceId?: string): Promise<void> {
    const url = deviceId
      ? `${SPOTIFY_API_BASE}/me/player/pause?device_id=${deviceId}`
      : `${SPOTIFY_API_BASE}/me/player/pause`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Errore nella pausa: ${response.status}`);
    }
  }

  /**
   * Salta alla traccia successiva
   */
  async skipToNext(deviceId?: string): Promise<void> {
    const url = deviceId
      ? `${SPOTIFY_API_BASE}/me/player/next?device_id=${deviceId}`
      : `${SPOTIFY_API_BASE}/me/player/next`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Errore skip next: ${response.status}`);
    }
  }

  /**
   * Torna alla traccia precedente
   */
  async skipToPrevious(deviceId?: string): Promise<void> {
    const url = deviceId
      ? `${SPOTIFY_API_BASE}/me/player/previous?device_id=${deviceId}`
      : `${SPOTIFY_API_BASE}/me/player/previous`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Errore skip previous: ${response.status}`);
    }
  }

  /**
   * Imposta il volume
   */
  async setVolume(volumePercent: number, deviceId?: string): Promise<void> {
    const volume = Math.max(0, Math.min(100, volumePercent));
    const url = deviceId
      ? `${SPOTIFY_API_BASE}/me/player/volume?volume_percent=${volume}&device_id=${deviceId}`
      : `${SPOTIFY_API_BASE}/me/player/volume?volume_percent=${volume}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Errore impostazione volume: ${response.status}`);
    }
  }

  /**
   * Attiva/disattiva lo shuffle
   */
  async setShuffle(state: boolean, deviceId?: string): Promise<void> {
    const url = deviceId
      ? `${SPOTIFY_API_BASE}/me/player/shuffle?state=${state}&device_id=${deviceId}`
      : `${SPOTIFY_API_BASE}/me/player/shuffle?state=${state}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Errore shuffle: ${response.status}`);
    }
  }

  /**
   * Imposta la modalità repeat
   */
  async setRepeat(state: 'track' | 'context' | 'off', deviceId?: string): Promise<void> {
    const url = deviceId
      ? `${SPOTIFY_API_BASE}/me/player/repeat?state=${state}&device_id=${deviceId}`
      : `${SPOTIFY_API_BASE}/me/player/repeat?state=${state}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Errore repeat: ${response.status}`);
    }
  }

  /**
   * Cerca una posizione specifica nella traccia corrente
   */
  async seek(positionMs: number, deviceId?: string): Promise<void> {
    const url = deviceId
      ? `${SPOTIFY_API_BASE}/me/player/seek?position_ms=${positionMs}&device_id=${deviceId}`
      : `${SPOTIFY_API_BASE}/me/player/seek?position_ms=${positionMs}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Errore seek: ${response.status}`);
    }
  }

  // ========== SEARCH APIs ==========

  /**
   * Cerca tracce, artisti, album o playlist
   */
  async search(query: string, types: ('track' | 'artist' | 'album' | 'playlist')[], limit = 20): Promise<{
    tracks?: SpotifyPagingObject<SpotifyTrack>;
    artists?: SpotifyPagingObject<SpotifyArtist>;
    albums?: SpotifyPagingObject<any>;
    playlists?: SpotifyPagingObject<SpotifyPlaylist>;
  }> {
    const typeString = types.join(',');
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodedQuery}&type=${typeString}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }
}

// Esporta un'istanza singleton del servizio
export const spotifyApi = new SpotifyApiService();
