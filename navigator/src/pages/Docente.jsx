import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import { io } from 'socket.io-client';

export default function Docente() {
  const { visitaId } = useParams();
  const navigate = useNavigate();

  const [visita, setVisita] = useState(null);
  const [codiceSessione, setCodiceSessione] = useState('CARICAMENTO...');
  const [indiceAttuale, setIndiceAttuale] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchAuth(`/api/visite/${visitaId}`)
      .then(res => res.json())
      .then(data => setVisita(data));

    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('docente:crea', { visitaId });
    });

    socket.on('sessione:creata', (dati) => {
      if (dati?.codice) setCodiceSessione(dati.codice);
    });

    return () => {
      socket.disconnect();
    };
  }, [visitaId]);

  const tappe = (visita?.items ?? []).filter(tappa => tappa.itemId);
  const itemCorrente = tappe[indiceAttuale]?.itemId;

  const cambiaTappa = (nuovoIndice) => {
    if (nuovoIndice < 0 || nuovoIndice >= tappe.length) return;
    setIndiceAttuale(nuovoIndice);
    
    // Parliamo la lingua esatta del backend
    socketRef.current?.emit('docente:vaiA', {
      codice: codiceSessione,
      indice: nuovoIndice
    });
  };

  return (
    <div className="container mt-4 text-center" style={{ maxWidth: '500px' }}>
      <div className="card p-4 shadow-sm mb-4">
        <h3 className="fw-bold mb-2">Pannello Docente</h3>
        <p className="text-muted small mb-3">
          Fai inserire questo codice agli studenti per sincronizzare la lezione:
        </p>
        <div className="bg-light border rounded p-3 mb-3">
          <span className="display-4 fw-bold text-danger tracking-wider">
            {codiceSessione}
          </span>
        </div>
        <button
          className="btn btn-outline-danger btn-sm w-100"
          onClick={() => {
            // il disconnect da solo lascia la stanza nella Map del server: va chiusa a mano
            socketRef.current?.emit('docente:chiudi', { codice: codiceSessione });
            navigate('/');
          }}
        >
          Chiudi Sessione Live
        </button>
      </div>

      {visita && (
        <div className="card p-4 shadow-sm text-start">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="badge bg-danger">Controllo Live</span>
            <span className="fw-bold text-muted">
              Tappa {indiceAttuale + 1} di {tappe.length}
            </span>
          </div>

          <h4 className="fw-bold fs-5 mb-2">{itemCorrente?.titolo || 'Tappa Visita'}</h4>

          {itemCorrente?.immagine && (
            <img
              src={itemCorrente.immagine}
              alt={itemCorrente.titolo}
              className="img-fluid rounded mb-3"
              style={{ maxHeight: '180px', objectFit: 'cover', width: '100%' }}
            />
          )}

          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-outline-secondary flex-grow-1 fw-bold"
              disabled={indiceAttuale === 0}
              onClick={() => cambiaTappa(indiceAttuale - 1)}
            >
              ← Precedente
            </button>
            <button
              className="btn btn-danger flex-grow-1 fw-bold"
              disabled={indiceAttuale === tappe.length - 1}
              onClick={() => cambiaTappa(indiceAttuale + 1)}
            >
              Successivo →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}