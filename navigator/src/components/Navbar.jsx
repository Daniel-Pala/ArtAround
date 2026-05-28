import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUtenteLoggato } from '../auth';

export default function Navbar() {
  const navigate = useNavigate();
  const utente = getUtenteLoggato();

  const handleLogout = () => {
    localStorage.removeItem('utente');
    window.location.href = '/login';
  };

  return (
    <nav className="navbar navbar-dark bg-primary shadow-sm mb-4">
      <div className="container">
        <span 
          className="navbar-brand fw-bold d-flex align-items-center" 
          style={{ cursor: 'pointer' }} 
          onClick={() => navigate('/')}
        >
          <span className="me-2">🏛️</span> ArtAround Navigator
        </span>
        
        {utente && (
          <div className="d-flex align-items-center text-white">
            <span className="me-3 small d-none d-md-inline">
              Utente: <strong>{utente.username}</strong> 
              <span className="badge bg-light text-primary text-uppercase ms-1">{utente.ruolo}</span>
            </span>
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm fw-bold">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}