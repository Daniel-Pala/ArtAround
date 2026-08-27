import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Studente() {
  const [codice, setCodice] = useState('');
  const [nome, setNome] = useState('');
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  const gestisciInvio = (e) => {
    e.preventDefault();
    const codicePulito = codice.trim().toUpperCase();
    if (!codicePulito || codicePulito.length < 5) {
      setErrore('Inserisci un codice valido di 6 caratteri (es. X8K9A2)');
      return;
    }
    const nomePulito = nome.trim();
    if (!nomePulito) {
      setErrore('Scrivi il tuo nome, serve al docente per riconoscerti');
      return;
    }
    // Reindirizza al player live senza dover conoscere a priori il visitaId
    navigate(`/player/live?sessione=${codicePulito}&nome=${encodeURIComponent(nomePulito)}`);
  };

  return (
    <div className="container mt-5 text-center" style={{ maxWidth: '420px' }}>
      <div className="card p-4 shadow-sm border-0 bg-light">
        <h3 className="fw-bold mb-3">Partecipa a Lezione Live</h3>
        <p className="text-muted small mb-4">
          Inserisci il codice di 6 caratteri mostrato sul pannello del tuo docente per iniziare la visita sincronizzata.
        </p>
        <form onSubmit={gestisciInvio}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control form-control-lg text-center fw-bold text-uppercase"
              placeholder="Es. X8K9A2"
              maxLength={6}
              value={codice}
              onChange={(e) => {
                setCodice(e.target.value);
                setErrore('');
              }}
              style={{ fontSize: '1.5rem', letterSpacing: '4px' }}
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              className="form-control text-center"
              placeholder="Il tuo nome"
              maxLength={30}
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErrore('');
              }}
            />
          </div>
          {errore && <div className="text-danger small mb-3">{errore}</div>}
          <button type="submit" className="btn btn-danger btn-lg w-100 fw-bold">
            Entra nella Lezione
          </button>
        </form>
      </div>
    </div>
  );
}