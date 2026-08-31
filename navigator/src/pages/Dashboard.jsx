import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import Navbar from '../components/Navbar';

function Dashboard() {
  const [visite, setVisite] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // il percorso su misura: quanto tempo si ha, con chi si e', cosa interessa
  const [mostraMisura, setMostraMisura] = useState(false);
  const [stili, setStili] = useState([]);
  const [minuti, setMinuti] = useState('60');
  const [compagnia, setCompagnia] = useState('solo');
  const [interessi, setInteressi] = useState([]);
  const [componendo, setComponendo] = useState(false);
  const [erroreMisura, setErroreMisura] = useState('');

  useEffect(() => {
    fetchAuth('/api/visite/mie-visite')
      
    .then(res => res.json()) // == function(res) { return res.json(); } is equivalent to res => res.json()
      .then(data => {
        //controllo perche potrebbe essere anche errore
        if (Array.isArray(data)) setVisite(data); 
      })
      .finally(() => setLoading(false));
  }, []);

  // Le caselle "cosa ti interessa" sono gli stili delle opere che l'utente puo' gia' leggere:
  // l'elenco lo fa il backend, che e' l'unico a sapere quali visite sono sue.
  useEffect(() => {
    if (!mostraMisura || stili.length > 0) return;
    fetchAuth('/api/ai/interessi')
      .then(res => res.json())
      .then(elenco => { if (Array.isArray(elenco)) setStili(elenco); });
  }, [mostraMisura, stili.length]);

  const cambiaInteresse = (stile) =>
    setInteressi(scelti => scelti.includes(stile) ? scelti.filter(s => s !== stile) : [...scelti, stile]);

  // il percorso nasce dalle opere che l'utente ha gia' sbloccato: e' il backend a metterle
  // insieme, qui si mandano solo le tre risposte del form
  const componiVisita = async () => {
    setComponendo(true);
    setErroreMisura('');
    const res = await fetchAuth('/api/ai/visita', {
      method: 'POST',
      body: JSON.stringify({ minuti, compagnia, interessi })
    });
    const dati = await res.json();
    setComponendo(false);
    if (res.ok) navigate(`/player/${dati._id}`);
    else setErroreMisura(dati.message || 'Non sono riuscito a preparare il percorso.');
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="section-head mb-4 d-flex justify-content-between align-items-end gap-3">
          <div>
            <h1 className="section-title">Le mie visite</h1>
            <p className="section-sub mt-2 mb-0">Premi Avvia quando sei al museo.</p>
          </div>
          <div className="d-flex gap-2">
            {/* senza visite sbloccate non c'e' niente con cui comporre un percorso */}
            {visite.length > 0 && (
              <button className="btn btn-outline-primary btn-sm text-nowrap" onClick={() => setMostraMisura(m => !m)}>
                Percorso su misura
              </button>
            )}
            {/* la lezione di un altro non e' fra le proprie visite: si entra col codice, non da una card */}
            <button className="btn btn-outline-primary btn-sm text-nowrap" onClick={() => navigate('/studente')}>
              Partecipa a una lezione
            </button>
          </div>
        </div>

        {mostraMisura && (
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="fs-5 fw-semibold mb-1">Un percorso adatto a te</h2>
              <p className="text-muted small mb-3">
                Scegliamo noi le tappe fra le opere che hai gia' sbloccato, nel tempo che hai.
              </p>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label small text-muted mb-1" htmlFor="misuraTempo">Quanto tempo hai</label>
                  <select id="misuraTempo" className="form-select form-select-sm" value={minuti} onChange={(e) => setMinuti(e.target.value)}>
                    <option value="30">Mezz'ora</option>
                    <option value="60">Un'ora</option>
                    <option value="120">Due ore</option>
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label small text-muted mb-1" htmlFor="misuraCompagnia">Con chi sei</label>
                  <select id="misuraCompagnia" className="form-select form-select-sm" value={compagnia} onChange={(e) => setCompagnia(e.target.value)}>
                    <option value="solo">Da solo</option>
                    <option value="coppia">In due</option>
                    <option value="bambini">Con bambini</option>
                    <option value="gruppo">In gruppo</option>
                  </select>
                </div>
              </div>

              {stili.length > 0 && (
                <fieldset className="mt-3">
                  <legend className="form-label small text-muted mb-1">Cosa ti interessa</legend>
                  <div className="d-flex flex-wrap gap-3">
                    {stili.map(stile => (
                      <div key={stile} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`stile-${stile}`}
                          checked={interessi.includes(stile)}
                          onChange={() => cambiaInteresse(stile)}
                        />
                        <label className="form-check-label small" htmlFor={`stile-${stile}`}>{stile}</label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}

              {erroreMisura && <p className="text-danger small mt-3 mb-0">{erroreMisura}</p>}

              <button className="btn btn-primary btn-sm mt-3" onClick={componiVisita} disabled={componendo}>
                {componendo ? 'Sto preparando il percorso...' : 'Preparalo'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : visite.length === 0 ? (
          <div className="text-muted text-center py-5">
            Non hai ancora sbloccato nessuna visita.<br />
            Acquistane una dal marketplace per iniziare.
          </div>
        ) : (
          <div className="row g-3">
            {visite.map(v => (
              <div key={v._id} className="col-md-6 col-lg-4">
                <article className="card h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="eyebrow mb-2">{v.museoId?.nome || 'Museo'}</div>
                    <h5 className="card-title mb-2">{v.nome}</h5>
                    <p className="card-text text-muted small flex-grow-1">{v.infoLogistiche || 'Nessuna informazione logistica.'}</p>
                    {/* niente prezzo: queste visite l'utente le ha gia' sbloccate.
                        Il numero di tappe invece serve a capire quanto dura il giro */}
                    <div className="d-flex justify-content-between align-items-end pt-3 border-top">
                      <div className="text-muted small">
                        {v.items.length} {v.items.length === 1 ? 'tappa' : 'tappe'}
                      </div>
                      <div className="d-flex gap-2">
                        {/* stessa visita, due modi di farla: da soli oppure guidando una classe */}
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/docente/${v._id}`)}>
                          Guida una classe
                        </button>
                        <button className="btn btn-sm btn-success" onClick={() => navigate(`/player/${v._id}`)}>
                          <i className="bi bi-play-fill me-1"></i>Avvia
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default Dashboard;
