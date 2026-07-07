import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';

// scale ordinate: i comandi "dimmi di piu/meno" e "piu/troppo semplice" ci si muovono su
const DURATE = ['3s', '15s', '1min', '4min'];
const LIVELLI = ['infantile', 'elementare', 'medio', 'specialistico'];

function Player() {
  const { visitaId } = useParams();
  const navigate = useNavigate();

  const [visita, setVisita] = useState(null);
  const [loading, setLoading] = useState(true);

  const [indiceAttuale, setIndiceAttuale] = useState(0);
  const [livelloScelto, setLivelloScelto] = useState('medio');
  const [durataScelta, setDurataScelta] = useState('15s');

  const [parlando, setParlando] = useState(false);
  const [inPausa, setInPausa] = useState(false);

  const [voci, setVoci] = useState([]);
  const [voceScelta, setVoceScelta] = useState('');

  const [ascoltando, setAscoltando] = useState(false);
  const [statoVoce, setStatoVoce] = useState('');
  const riconoscimentoRef = useRef(null);

  useEffect(() => {
    fetchAuth(`/api/visite/${visitaId}`)
      .then(res => res.json())
      .then(data => setVisita(data))
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

  // esco dal player: fermo audio e microfono
  useEffect(() => () => {
    window.speechSynthesis.cancel();
    riconoscimentoRef.current?.abort();
  }, []);

  // la visita arriva gia con gli items dentro, a me servono solo le opere
  const opere = visita?.items?.map(item => item.itemId) ?? [];

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (opere.length === 0) return <div className="alert alert-warning m-3 text-center">Nessuna opera presente in questo percorso.</div>;

  const operaCorrente = opere[indiceAttuale];

  // tra i testi dell'opera cerco quello che combacia con livello e durata scelti
  const testoTrovato = operaCorrente?.testi?.find(
    t => t.livello === livelloScelto && t.durata === durataScelta
  );

  // azioni: le richiamano sia i bottoni sia i comandi vocali
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

  const pausa = () => {
    if (parlando && !inPausa) { window.speechSynthesis.pause(); setInPausa(true); }
  };

  const riprendi = () => {
    if (parlando && inPausa) { window.speechSynthesis.resume(); setInPausa(false); }
  };

  // il bottone centrale e' un solo tasto, quindi alterna; i comandi vocali invece sono distinti
  const gestisciAudio = () => {
    if (!parlando) return leggi();
    inPausa ? riprendi() : pausa();
  };

  const vaiIndietro = () => { if (indiceAttuale > 0) setIndiceAttuale(indiceAttuale - 1); };
  const vaiAvanti = () => { if (indiceAttuale < opere.length - 1) setIndiceAttuale(indiceAttuale + 1); };

  const cambiaDurata = (verso) => setDurataScelta(d => DURATE[Math.min(Math.max(DURATE.indexOf(d) + verso, 0), DURATE.length - 1)]);
  const cambiaLivello = (verso) => setLivelloScelto(l => LIVELLI[Math.min(Math.max(LIVELLI.indexOf(l) + verso, 0), LIVELLI.length - 1)]);

  const staLeggendo = parlando && !inPausa;

  // vocabolario controllato: ogni comando ha piu' frasi accettate e l'azione del bottone corrispondente
  const comandi = [
    { nome: 'Prossimo', frasi: ['prossim', 'avanti', 'successiv'], azione: vaiAvanti },
    { nome: 'Precedente', frasi: ['precedent', 'indietro'], azione: vaiIndietro },
    { nome: 'Pausa', frasi: ['pausa', 'ferma', 'stop'], azione: pausa },
    { nome: 'Riprendi', frasi: ['riprendi', 'continua'], azione: riprendi },
    { nome: 'Ripeti', frasi: ['ripeti', 'rileggi', 'ancora'], azione: leggi },
    { nome: 'Leggi', frasi: ['leggi', "cos'e questo", 'cosa e questo', 'ascolta'], azione: leggi },
    { nome: 'Piu dettagli', frasi: ['dimmi di piu', 'piu lungo', 'piu dettagli'], azione: () => cambiaDurata(1) },
    { nome: 'Meno dettagli', frasi: ['dimmi di meno', 'piu corto', 'piu breve'], azione: () => cambiaDurata(-1) },
    { nome: 'Piu semplice', frasi: ['non capisco', 'piu semplice', 'troppo difficile'], azione: () => cambiaLivello(-1) },
    { nome: 'Piu avanzato', frasi: ['troppo semplice', 'piu difficile', 'piu avanzato'], azione: () => cambiaLivello(1) },
    { nome: 'Esci', frasi: ['esci', 'chiudi', 'torna alle visite'], azione: () => navigate(-1) },
  ];

  const eseguiComando = (trascrizione) => {
    const frase = trascrizione.toLowerCase().replace(/[''`]/g, '').trim();
    const comando = comandi.find(c => c.frasi.some(f => frase.includes(f)));
    if (comando) {
      setStatoVoce(`Ho capito: ${comando.nome}`);
      comando.azione();
    } else {
      setStatoVoce(`Non ho capito: "${trascrizione}"`);
    }
  };

  // push-to-talk: tocco il microfono, dico un comando, si ferma da solo dopo la frase
  const riconoscimentoSupportato = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const ascolta = () => {
    if (ascoltando) { riconoscimentoRef.current?.abort(); return; }
    const Riconoscimento = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Riconoscimento();
    rec.lang = 'it-IT';
    rec.onresult = (e) => eseguiComando(e.results[0][0].transcript);
    rec.onerror = () => setStatoVoce('Non ho sentito, riprova');
    rec.onend = () => setAscoltando(false);
    riconoscimentoRef.current = rec;
    setStatoVoce('');
    setAscoltando(true);
    rec.start();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', overflow: 'hidden', background: 'var(--bs-body-color)' }}>
      <div className="bg-light d-flex flex-column" style={{ width: '100%', maxWidth: '480px', height: '100%' }}>

        <div className="bg-light border-bottom p-3 d-flex align-items-center flex-shrink-0">
          <button className="btn btn-sm btn-link text-body text-decoration-none p-0 fw-semibold flex-shrink-0" style={{ width: '88px' }} onClick={() => navigate(-1)}>
            <i className="bi bi-x-lg me-1"></i>Chiudi
          </button>
          <span className="fw-semibold text-truncate text-center flex-grow-1 px-2" style={{ minWidth: 0 }}>{visita?.nome}</span>
          <div className="d-flex align-items-center justify-content-end gap-2 flex-shrink-0" style={{ width: '88px' }}>
            <span className="small text-muted">{indiceAttuale + 1} / {opere.length}</span>
            {riconoscimentoSupportato && (
              <button
                className={`btn btn-sm ${ascoltando ? 'btn-danger' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
                style={{ width: '38px', height: '38px' }}
                onClick={ascolta}
                aria-label={ascoltando ? 'Ferma ascolto' : 'Comando vocale'}
              >
                <i className={`bi ${ascoltando ? 'bi-mic-fill' : 'bi-mic'}`}></i>
              </button>
            )}
          </div>
        </div>

        {(ascoltando || statoVoce) && (
          <div className="border-bottom px-3 py-2 small d-flex align-items-center gap-2 flex-shrink-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
            <i className={`bi ${ascoltando ? 'bi-mic-fill text-danger' : 'bi-chat-left-text text-muted'}`}></i>
            <span className={ascoltando ? 'fw-semibold' : 'text-muted'}>
              {ascoltando ? 'Sto ascoltando...' : statoVoce}
            </span>
          </div>
        )}

        <div className="p-3 flex-grow-1 overflow-auto" style={{ minHeight: 0, overscrollBehavior: 'contain' }}>
          <h2 className="fs-4 fw-bold mb-3">{operaCorrente?.titolo}</h2>

          {operaCorrente?.immagine ? (
            <img
              src={operaCorrente.immagine}
              alt={operaCorrente.titolo}
              className="img-fluid rounded mb-3 w-100"
              style={{ maxHeight: '200px', objectFit: 'cover' }}
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center text-muted mx-auto rounded mb-3" style={{ width: '96px', height: '96px', border: '1px dashed var(--bs-border-color)' }}>
              <i className="bi bi-image fs-4"></i>
            </div>
          )}

          {testoTrovato ? (
            <div className="mb-3" style={{ lineHeight: '1.6' }}>
              {testoTrovato.testo}
            </div>
          ) : (
            <div className="text-muted fst-italic mb-3">Nessun testo disponibile.</div>
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

        <div className="bg-light border-top py-2 px-4 d-flex justify-content-between align-items-center flex-shrink-0">
          <button
            className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '46px', height: '46px' }}
            disabled={indiceAttuale === 0}
            onClick={vaiIndietro}
            aria-label="Opera precedente"
          >
            <i className="bi bi-skip-start-fill fs-5"></i>
          </button>
          <button
            className={`btn ${testoTrovato ? 'btn-primary' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
            style={{ width: '62px', height: '62px' }}
            disabled={!testoTrovato}
            onClick={gestisciAudio}
            aria-label={!testoTrovato ? 'Audio non disponibile' : staLeggendo ? 'Pausa' : 'Ascolta'}
          >
            <i className={`bi ${!testoTrovato ? 'bi-volume-mute' : staLeggendo ? 'bi-pause-fill' : 'bi-play-fill'} fs-3`}></i>
          </button>
          <button
            className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '46px', height: '46px' }}
            disabled={indiceAttuale === opere.length - 1}
            onClick={vaiAvanti}
            aria-label="Opera successiva"
          >
            <i className="bi bi-skip-end-fill fs-5"></i>
          </button>
        </div>

      </div>
    </div>
  );
}
export default Player;
