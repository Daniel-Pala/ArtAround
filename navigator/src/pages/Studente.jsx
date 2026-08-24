import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Studente() {
  const [codice, setCodice] = useState('');
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  const gestisciInvio = (e) => {
    e.preventDefault();
    const codicePulito = codice.trim().toUpperCase();

    if (codicePulito.length !== 6) {
      setErrore('Il codice deve essere di 6 caratteri.');
      return;
    }

    setErrore('');
    
    // NIENTE PIÙ SOCKET QUI! Deleghiamo tutto al Player.
    // Così la connessione non si aggancia e sgancia distruggendo la stanza.
    const visitaId = '6a8c925b8c56fe2d5e2975f0';
    navigate(`/player/${visitaId}?sessione=${codicePulito}`);
  };

  return (
    <div className="container mt-5 text-center" style={{ maxWidth: '450px' }}>
      <h2 className="fw-bold mb-3">Unisciti alla Visita</h2>
      <p className="text-muted mb-4">
        Inserisci il codice a 6 cifre fornito dal docente per accedere alla sessione live.
      </p>

      <form onSubmit={gestisciInvio} className="card p-4 shadow-sm bg-light">
        <div className="mb-3">
          <input
            type="text"
            className="form-control form-control-lg text-center text-uppercase fw-bold fs-2"
            placeholder="Es. RVU3GZ"
            maxLength={6}
            value={codice}
            onChange={(e) => setCodice(e.target.value)}
            autoFocus
          />
        </div>

        {errore && <div className="alert alert-danger py-2 mb-3">{errore}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-lg w-100 fw-bold"
          disabled={codice.trim().length !== 6}
        >
          Entra nella Stanza
        </button>
      </form>

      <button
        className="btn btn-link text-secondary mt-3 text-decoration-none"
        onClick={() => navigate('/')}
      >
        ← Torna alla Dashboard
      </button>
    </div>
  );
}