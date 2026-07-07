import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';

function Player() {
  const { visitaId } = useParams();
  const navigate = useNavigate();

  const [visita, setVisita] = useState(null);
  const [opere, setOpere] = useState([]);
  const [loading, setLoading] = useState(true);

  const [indiceAttuale, setIndiceAttuale] = useState(0);
  const [livelloScelto, setLivelloScelto] = useState('medio');
  const [durataScelta, setDurataScelta] = useState('15s');

  const [parlando, setParlando] = useState(false);
  const [inPausa, setInPausa] = useState(false);

  const [voci, setVoci] = useState([]);
  const [voceScelta, setVoceScelta] = useState('');

  useEffect(() => {
    fetchAuth(`/api/visite/${visitaId}`)
      .then(res => res.json())
      .then(data => {
        setVisita(data);
        // la visita arriva gia con gli items dentro, a me servono solo le opere
        if (data.items) setOpere(data.items.map(item => item.itemId));
      })
      .finally(() => setLoading(false));
  }, [visitaId]);

  // le voci del browser arrivano in modo asincrono: tengo quelle italiane e ne scelgo una
  useEffect(() => {
    const caricaVoci = () => {
      const tutte = window.speechSynthesis.getVoices();
      const italiane = tutte.filter(v => v.lang.toLowerCase().startsWith('it'));
      const disponibili = italiane.length ? italiane : tutte;
      setVoci(disponibili);
      setVoceScelta(scelta => scelta || disponibili[0]?.voiceURI || '');
    };
    caricaVoci();
    window.speechSynthesis.onvoiceschanged = caricaVoci;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // se cambia opera o combinazione livello/durata, azzero l'audio in corso
  useEffect(() => {
    window.speechSynthesis.cancel();
    setParlando(false);
    setInPausa(false);
  }, [indiceAttuale, livelloScelto, durataScelta]);

  // esco dal player: fermo l'audio
  useEffect(() => () => window.speechSynthesis.cancel(), []);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (opere.length === 0) return <div className="alert alert-warning m-3 text-center">Nessuna opera presente in questo percorso.</div>;

  const operaCorrente = opere[indiceAttuale];

  // tra i testi dell'opera cerco quello che combacia con livello e durata scelti
  const testoTrovato = operaCorrente?.testi?.find(
    t => t.livello === livelloScelto && t.durata === durataScelta
  );

  // azioni: le richiameranno sia i bottoni sia (poi) i comandi vocali
  const leggi = () => {
    if (!testoTrovato) return;
    window.speechSynthesis.cancel();
    const voce = new SpeechSynthesisUtterance(testoTrovato.testo);
    voce.lang = 'it-IT';
    const vocePreferita = voci.find(v => v.voiceURI === voceScelta);
    if (vocePreferita) voce.voice = vocePreferita;
    voce.onend = () => { setParlando(false); setInPausa(false); };
    window.speechSynthesis.speak(voce);
    setParlando(true);
    setInPausa(false);
  };

  const gestisciAudio = () => {
    if (!parlando) return leggi();
    if (inPausa) {
      window.speechSynthesis.resume();
      setInPausa(false);
    } else {
      window.speechSynthesis.pause();
      setInPausa(true);
    }
  };

  const vaiIndietro = () => { if (indiceAttuale > 0) setIndiceAttuale(indiceAttuale - 1); };
  const vaiAvanti = () => { if (indiceAttuale < opere.length - 1) setIndiceAttuale(indiceAttuale + 1); };

  const staLeggendo = parlando && !inPausa;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', background: 'var(--bs-body-color)' }}>
      <div className="bg-light" style={{ width: '100%', maxWidth: '480px', minHeight: '100vh', position: 'relative', paddingBottom: '110px' }}>

        <div className="bg-light border-bottom p-3 d-flex justify-content-between align-items-center sticky-top">
          <button className="btn btn-sm btn-link text-body text-decoration-none p-0 fw-semibold" onClick={() => navigate(-1)}>
            <i className="bi bi-x-lg me-1"></i>Chiudi
          </button>
          <span className="fw-semibold text-truncate mx-2" style={{ maxWidth: '200px' }}>{visita?.nome}</span>
          <span className="small text-muted">opera {indiceAttuale + 1} di {opere.length}</span>
        </div>

        <div className="p-4">
          <h2 className="fw-bold mb-1">{operaCorrente?.titolo}</h2>
          <p className="text-muted small mb-4">Licenza: {operaCorrente?.licenza || 'Standard'}</p>

          {testoTrovato ? (
            <div className="card mb-4">
              <div className="card-body" style={{ fontSize: '1.1rem', lineHeight: '1.65' }}>
                {testoTrovato.testo}
              </div>
            </div>
          ) : (
            <div className="text-muted fst-italic mb-4 d-flex align-items-start gap-2">
              <span> Nessun testo disponibile.</span>
            </div>
          )}

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small text-muted mb-1">Livello</label>
              <select className="form-select form-select-sm" value={livelloScelto} onChange={(e) => setLivelloScelto(e.target.value)}>
                <option value="infantile">Bambino</option>
                <option value="elementare">Studente</option>
                <option value="medio">Generale</option>
                <option value="specialistico">Esperto</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small text-muted mb-1">Durata</label>
              <select className="form-select form-select-sm" value={durataScelta} onChange={(e) => setDurataScelta(e.target.value)}>
                <option value="3s">3 sec</option>
                <option value="15s">15 sec</option>
                <option value="1min">1 min</option>
                <option value="4min">4 min</option>
              </select>
            </div>
            {voci.length > 1 && (
              <div className="col-12">
                <label className="form-label small text-muted mb-1">Voce</label>
                <select className="form-select form-select-sm" value={voceScelta} onChange={(e) => setVoceScelta(e.target.value)}>
                  {voci.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="position-absolute bottom-0 start-0 w-100 bg-light border-top py-3 px-4 d-flex justify-content-between align-items-center">
          <button
            className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '52px', height: '52px' }}
            disabled={indiceAttuale === 0}
            onClick={vaiIndietro}
            aria-label="Opera precedente"
          >
            <i className="bi bi-skip-start-fill fs-4"></i>
          </button>
          <button
            className={`btn ${testoTrovato ? 'btn-primary' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
            style={{ width: '74px', height: '74px' }}
            disabled={!testoTrovato}
            onClick={gestisciAudio}
            aria-label={!testoTrovato ? 'Audio non disponibile' : staLeggendo ? 'Pausa' : 'Ascolta'}
          >
            <i className={`bi ${!testoTrovato ? 'bi-volume-mute' : staLeggendo ? 'bi-pause-fill' : 'bi-play-fill'} fs-1`}></i>
          </button>
          <button
            className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '52px', height: '52px' }}
            disabled={indiceAttuale === opere.length - 1}
            onClick={vaiAvanti}
            aria-label="Opera successiva"
          >
            <i className="bi bi-skip-end-fill fs-4"></i>
          </button>
        </div>

      </div>
    </div>
  );
}
export default Player;
