import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUtenteLoggato } from '../auth';

const URL_MARKETPLACE = 'http://localhost:3000/index.html';

// Montata solo dalla Dashboard, che sta dietro ProtectedRoute: qui l'utente c'e' sempre.
// Durante la visita il Player e' a tutto schermo e non monta la navbar.
function Navbar() {
  const navigate = useNavigate();
  const utente = getUtenteLoggato();

  const handleLogout = () => {
    localStorage.removeItem('utente');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      {/* container e non container-fluid: stessi margini del marketplace */}
      <div className="container">
        <div className="d-flex align-items-center gap-3">
          <Link className="navbar-brand fw-bold d-flex align-items-center m-0" to="/">
            <i className="bi bi-palette me-2"></i> ArtAround Navigator
          </Link>
          {/* il marketplace e' l'altra applicazione, quindi link vero e non rotta React.
              Sta a sinistra perche' e' un "torna indietro", non un'azione sull'account */}
          <a className="small text-light text-decoration-none" href={URL_MARKETPLACE}>
            <i className="bi bi-arrow-left me-1"></i>Marketplace
          </a>
        </div>

        <div className="d-flex align-items-center">
          <span className="navbar-text text-light me-3 d-none d-sm-inline">
            Ciao, <strong>{utente.username}</strong>
          </span>
          <button className="btn btn-outline-light btn-sm fw-bold" onClick={handleLogout}>
            Esci
          </button>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
