import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUtenteLoggato } from '../auth';

function Navbar() {
  const navigate = useNavigate();
  const utente = getUtenteLoggato();

  const handleLogout = () => {
    localStorage.removeItem('utente');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <i className="bi bi-palette me-2"></i> ArtAround Navigator
        </Link>

        <div className="d-flex align-items-center">
          {utente ? (
            <>
              <span className="navbar-text text-light me-3 d-none d-sm-inline">
                Ciao, <strong>{utente.username}</strong>
              </span>
              <button className="btn btn-outline-light btn-sm fw-bold" onClick={handleLogout}>
                Esci
              </button>
            </>
          ) : (
            <Link className="btn btn-outline-light btn-sm fw-bold" to="/login">
              Accedi
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
