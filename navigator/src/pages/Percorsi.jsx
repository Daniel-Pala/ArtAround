import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth, getUtenteLoggato } from '../auth';
import Navbar from '../components/Navbar';

function Percorsi() {
  const { id: museoId } = useParams();
  const navigate = useNavigate();
  const utente = getUtenteLoggato();
  
  const [museo, setMuseo] = useState(null);
  const [visite, setVisite] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuth(`/api/musei/${museoId}`)
      .then(res => res.json())
      .then(data => setMuseo(data));

    fetchAuth(`/api/visite?museoId=${museoId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVisite(data);
      })
      .finally(() => setLoading(false));
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
        <button onClick={() => navigate('/')} className="btn btn-outline-secondary btn-sm fw-bold mb-4">
          <i className="bi bi-arrow-left me-1"></i>Torna ai musei
        </button>

        <div className="section-head mb-4">
          <div className="eyebrow">Museo</div>
          <h1 className="section-title">{museo?.nome || 'Dettaglio museo'}</h1>
          {museo?.descrizione && <p className="section-sub mt-2 mb-0">{museo.descrizione}</p>}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Percorsi di visita</h3>
          {utente?.ruolo?.toLowerCase() === 'autore' && (
            <button
              onClick={() => navigate(`/museo/${museoId}/nuovo-percorso`)}
              className="btn btn-primary fw-bold"
            >
              <i className="bi bi-plus-lg me-1"></i>Crea percorso
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
                <div className="card card-interactive">
                  <div className="card-body d-flex justify-content-between align-items-center p-4">
                    <div>
                      <h5 className="fw-bold mb-1">{v.nome}</h5>
                      <span className="text-muted small">di <strong>{v.autoreId?.username || 'Autore anonimo'}</strong></span>
                    </div>
                    <div className="d-flex align-items-center gap-4">
                      <div className="text-end">
                        <div className="price-label">Prezzo</div>
                        <div className="price">{v.prezzo ? `${v.prezzo}€` : 'Gratis'}</div>
                      </div>
                      <button
                        onClick={() => navigate(`/percorso/${v._id}/opere`)}
                        className="btn btn-outline-primary btn-sm fw-bold"
                      >
                        Esplora opere<i className="bi bi-arrow-right ms-1"></i>
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
export default Percorsi;