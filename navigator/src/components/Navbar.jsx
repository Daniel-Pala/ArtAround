import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  
  // Leggiamo l'utente salvato in memoria locale per capire se siamo loggati
  const utenteRaw = localStorage.getItem('utente');
  const utente = utenteRaw ? JSON.parse(utenteRaw) : null;

  // Funzione per gestire l'uscita
  const handleLogout = () => {
    localStorage.removeItem('utente'); // Cancella la sessione
    navigate('/login'); // Riporta alla schermata di accesso
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid px-4">
        {/* Logo e Titolo */}
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <span className="me-2 fs-4">🏛️</span> ArtAround Navigator
        </Link>
        
        {/* Area Utente a destra */}
        <div className="d-flex align-items-center">
          {utente ? (
            <>
              {/* Se loggato: Mostra Nome e bottone Logout */}
              <span className="navbar-text text-light me-3 d-none d-sm-inline">
                Ciao, <strong>{utente.username}</strong>
              </span>
              <button 
                className="btn btn-outline-light btn-sm fw-bold shadow-sm" 
                onClick={handleLogout}
              >
                Esci
              </button>
            </>
          ) : (
            <>
              {/* Se NON loggato: Mostra bottone Accedi */}
              <Link className="btn btn-outline-light btn-sm fw-bold shadow-sm" to="/login">
                Accedi
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}