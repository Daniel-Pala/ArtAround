import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth, getUtenteLoggato } from '../auth';
import Navbar from '../components/Navbar';

export default function Percorsi() {
  const { id: museoId } = useParams();
  const navigate = useNavigate();
  const utente = getUtenteLoggato();
  
  const [museo, setMuseo] = useState(null);
  const [visite, setVisite] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!museoId) return;

    // Aggiunto il prefisso /api mancante che causava il crash
    fetchAuth(`/api/musei/${museoId}`)
      .then(res => res.json())
      .then(data => setMuseo(data))
      .catch(err => console.error('Errore fetch museo:', err));

    // Aggiunto il prefisso /api mancante anche qui
    fetchAuth(`/api/visite?museoId=${museoId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVisite(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Errore fetch visite:', err);
        setLoading(false);
      });
  }, [museoId]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button onClick={() => navigate('/')} className="btn btn-outline-secondary btn-sm fw-bold">
            ← Torna ai Musei
          </button>
        </div>

        <div className="p-4 p-md-5 mb-4 text-white rounded bg-dark">
          <div className="col-md-8 px-0">
            <h1 className="display-6 fw-bold fst-italic">{museo?.nome || "Dettaglio Museo"}</h1>
            <p className="lead my-3 text-light">{museo?.descrizione || "Nessuna descrizione disponibile."}</p>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-secondary fw-semibold mb-0">Percorsi di Visita</h3>
          {utente?.ruolo?.toLowerCase() === 'autore' && (
            <button 
              onClick={() => navigate(`/museo/${museoId}/nuovo-percorso`)} 
              className="btn btn-primary fw-bold"
            >
              + Crea Nuovo Percorso
            </button>
          )}
        </div>

        {visite.length === 0 ? (
          <div className="alert alert-warning text-center p-4">
            Nessun percorso configurato per questo museo.
          </div>
        ) : (
          <div className="row g-3">
            {visite.map(v => (
              <div key={v._id} className="col-12">
                <div className="card shadow-sm border-start border-primary border-4">
                  <div className="card-body d-flex justify-content-between align-items-center p-4">
                    <div>
                      <h5 className="fw-bold mb-1 text-dark">{v.nome}</h5>
                      <span className="text-muted small">Creato da: <strong>{v.autoreId?.username || 'Autore Anonimo'}</strong></span>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-secondary me-3 p-2">Prezzo: {v.prezzo ? `${v.prezzo}€` : 'Gratis'}</span>
                      <button 
                        onClick={() => navigate(`/percorso/${v._id}/opere`)}
                        className="btn btn-outline-primary btn-sm fw-bold"
                      >
                        Esplora Opere
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}