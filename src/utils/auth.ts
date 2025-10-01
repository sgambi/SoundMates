// Gestione autenticazione e token
const TOKEN_KEY = 'spotify_access_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';

export const saveToken = (token: string, expiresIn: number): void => {
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

export const getToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    return null;
  }

  if (Date.now() > parseInt(expiry)) {
    clearToken();
    return null;
  }

  return token;
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

export const parseHashParams = (hash: string): { access_token?: string; expires_in?: string } => {
  const params: Record<string, string> = {};
  const hashParams = hash.substring(1).split('&');

  hashParams.forEach((param) => {
    const [key, value] = param.split('=');
    params[key] = decodeURIComponent(value);
  });

  return params;
};
