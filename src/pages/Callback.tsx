import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseHashParams, saveToken } from '../utils/auth';

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Estrae i parametri dall'hash dell'URL
    const hash = window.location.hash;
    const params = parseHashParams(hash);

    if (params.access_token && params.expires_in) {
      // Salva il token
      saveToken(params.access_token, parseInt(params.expires_in));

      // Pulisce l'URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Reindirizza alla dashboard
      navigate('/dashboard');
    } else {
      // Se non ci sono parametri validi, torna al login
      navigate('/');
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.2rem'
    }}>
      <p>Autenticazione in corso...</p>
    </div>
  );
};

export default Callback;
