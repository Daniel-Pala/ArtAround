import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';

export default function Player() {
  const { visitaId } = useParams();
  const navigate = useNavigate();

  // Stati per i dati
  const [visita, setVisita] = useState(null);
  const [opere, setOpere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState('');

  // Stati per la navigazione del player
  const [indiceAttuale, setIndiceAttuale] = useState(0);
  const [livelloScelto, setLivelloScelto] = useState('medio');
  const [durataScelta, setDurataScelta] = useState('15s');

  useEffect(() => {
    const fetchVisita = async () => {
      try {
        const res = await fetchAuth(`/api/visite/${visitaId}`);
        if (!res.ok) {
          throw new Error('Impossibile caricare il percorso.');
        }

        const data = await res.json();
        setVisita(data);
        
        // Estraiamo le opere popolate dal backend
        if (data.items && data.items.length > 0) {
          setOpere(data.items.map(item => item.itemId).filter(Boolean));
        }
      } catch (err) {
        setErrore(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisita();
  }, [visitaId]);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (errore) return <div className="alert alert-danger m-3 text-center">{errore}</div>;
  if (opere.length === 0) return <div className="alert alert-warning m-3 text-center">Nessuna opera presente in questo percorso.</div>;

  const operaCorrente = opere[indiceAttuale];

  // Logica per trovare il testo esatto in base alle scelte dell'utente
  let testoDaMostrare = "Testo non disponibile per questa combinazione di livello e durata.";
  if (operaCorrente && operaCorrente.testi) {
    const testoTrovato = operaCorrente.testi.find(
      t => t.livello === livelloScelto && t.durata === durataScelta
    );
    if (testoTrovato) testoDaMostrare = testoTrovato.testo;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', background: 'var(--bs-body-color)' }}>
      {/* Container che simula lo schermo di uno smartphone */}
      <div className="bg-light" style={{ width: '100%', maxWidth: '480px', minHeight: '100vh', position: 'relative', paddingBottom: '80px' }}>

        {/* Header del Player */}
        <div className="bg-light border-bottom p-3 d-flex justify-content-between align-items-center sticky-top">
          <button className="btn btn-sm btn-link text-body text-decoration-none p-0 fw-semibold" onClick={() => navigate(-1)}>
            <i className="bi bi-x-lg me-1"></i>Chiudi
          </button>
          <span className="fw-semibold text-truncate mx-2" style={{ maxWidth: '200px' }}>{visita?.nome}</span>
          <span className="small text-muted">{indiceAttuale + 1} / {opere.length}</span>
        </div>

        {/* Contenitore principale */}
        <div className="p-4">
          
          {/* Selettori di Profilazione */}
          <div className="card mb-4">
            <div className="card-body p-3">
              <div className="eyebrow mb-2">Le tue preferenze</div>
              <div className="row g-2">
                <div className="col-6">
                  <select className="form-select form-select-sm" value={livelloScelto} onChange={(e) => setLivelloScelto(e.target.value)}>
                    <option value="infantile">Bambino</option>
                    <option value="elementare">Studente</option>
                    <option value="medio">Generale</option>
                    <option value="specialistico">Esperto</option>
                  </select>
                </div>
                <div className="col-6">
                  <select className="form-select form-select-sm" value={durataScelta} onChange={(e) => setDurataScelta(e.target.value)}>
                    <option value="3s">3 sec</option>
                    <option value="15s">15 sec</option>
                    <option value="1min">1 min</option>
                    <option value="4min">4 min</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dettagli Opera */}
          <h2 className="fw-bold mb-1">{operaCorrente?.titolo}</h2>
          <p className="text-muted small mb-4">Licenza: {operaCorrente?.licenza || 'Standard'}</p>

          <div className="card mb-4">
            <div className="card-body" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              {testoDaMostrare}
            </div>
          </div>

        </div>

        {/* Controlli di Navigazione Fissi in basso */}
        <div className="position-absolute bottom-0 start-0 w-100 bg-light border-top p-3 d-flex justify-content-between align-items-center">
          <button
            className="btn btn-outline-secondary px-4 fw-bold"
            disabled={indiceAttuale === 0}
            onClick={() => setIndiceAttuale(indiceAttuale - 1)}
          >
            <i className="bi bi-arrow-left me-1"></i>Precedente
          </button>
          <button
            className="btn btn-primary px-4 fw-bold"
            disabled={indiceAttuale === opere.length - 1}
            onClick={() => setIndiceAttuale(indiceAttuale + 1)}
          >
            Successiva<i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>

      </div>
    </div>
  );
}