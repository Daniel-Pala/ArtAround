import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAuth } from '../auth';
import { io } from 'socket.io-client';

const DURATE = ['3s', '15s', '1min', '4min'];
const LIVELLI = ['infantile', 'elementare', 'medio', 'specialistico'];

const LOGISTICA = [
  ['uscita', 'Uscita'],
  ['toilette', 'Toilette'],
  ['bar', 'Bar'],
  ['shop', 'Shop'],
  ['ostacoli', 'Ostacoli e accessibilita'],
];

function Player() {
  const { visitaId: visitaIdParam } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codiceSessione = searchParams.get('sessione');

  const [visitaIdAttiva, setVisitaIdAttiva] = useState(
    visitaIdParam && visitaIdParam !== 'live' ? visitaIdParam : null
  );

  const [visita, setVisita] = useState(null);
  const [loading, setLoading] = useState(true);

  const [indiceAttuale, setIndiceAttuale] = useState(0);
  const [livelloScelto, setLivelloScelto] = useState('medio');
  const [durataScelta, setDurataScelta] = useState('15s');

  const [parlando, setParlando] = useState(false);
  const [inPausa, setInPausa] = useState(false);

  const [voci, setVoci] = useState([]);

  const [ascoltando, setAscoltando] = useState(false);
  const [statoVoce, setStatoVoce] = useState('');
  const riconoscimentoRef = useRef(null);
  const socketRef = useRef(null);

  const [config, setConfig] = useState(null);
  const [mostraMappa, setMostraMappa] = useState(false);
  const [mostraInfo, setMostraInfo] = useState(false);

  useEffect(() => {
    if (!visitaIdAttiva) return;
    setLoading(true);
    fetchAuth(`/api/visite/${visitaIdAttiva}`)
      .then(res => res.json())
      .then(data => setVisita(data))
      .finally(() => setLoading(false));
  }, [visitaIdAttiva]);

  useEffect(() => {
    if (!codiceSessione) return;

    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('studente:entra', { codice: codiceSessione, nome: 'Studente' });
    });

    socket.on('stato:item', (dati) => {
      if (dati) {
        if (typeof dati.indice === 'number') {
          setIndiceAttuale(dati.indice);
        }
        if (dati.visitaId) {
          setVisitaIdAttiva(prevId => prevId !== dati.visitaId ? dati.visitaId : prevId);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [codiceSessione]);

  useEffect(() => {
    const file = visita?.museoId?.configFile;
    if (!file) return;
    fetch(`/config/${file}`)
      .then(res => res.ok ? res.json() : null)
      .then(setConfig);
  }, [visita]);

  useEffect(() => {
    const caricaVoci = () => {
      const tutte = window.speechSynthesis.getVoices();
      const italiane = tutte.filter(v => v.lang.toLowerCase().startsWith('it'));
      setVoci(italiane.length ? italiane : tutte);
    };
    caricaVoci();
    window.speechSynthesis.onvoiceschanged = caricaVoci;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setParlando(false);
    setInPausa(false);
  }, [indiceAttuale, livelloScelto, durataScelta]);

  useEffect(() => () => {
    window.speechSynthesis.cancel();
    riconoscimentoRef.current?.abort();
  }, []);

  const tappe = (visita?.items ?? []).filter(tappa => tappa.itemId);
  const items = tappe.map(tappa => tappa.itemId);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (items.length === 0) return <div className="alert alert-warning m-3 text-center">Nessun item presente in questo percorso.</div>;

  const itemCorrente = items[indiceAttuale];
  const tappaCorrente = tappe[indiceAttuale];

  const testoTrovato = itemCorrente?.testi?.find(
    t => t.livello === livelloScelto && t.durata === durataScelta
  );

  const parla = (testo, onEnd) => {
    window.speechSynthesis.cancel();
    const voce = new SpeechSynthesisUtterance(testo);
    voce.lang = 'it-IT';
    if (voci[0]) voce.voice = voci[0];
    if (onEnd) voce.onend = onEnd;
    window.speechSynthesis.speak(voce);
  };

  const leggi = () => {
    if (!testoTrovato) return;
    const indicazione = tappaCorrente?.indicazioneLogistica;
    const daLeggere = indicazione ? `${indicazione}. ${testoTrovato.testo}` : testoTrovato.testo;
    parla(daLeggere, () => { setParlando(false); setInPausa(false); });
    setParlando(true);
    setInPausa(false);
  };

  const rispondiLogistica = (chiave) => {
    if (!config?.logistica?.[chiave]) return;
    setMostraInfo(true);
    parla(config.logistica[chiave]);
  };

  const pausa = () => {
    if (parlando && !inPausa) { window.speechSynthesis.pause(); setInPausa(true); }
  };

  const riprendi = () => {
    if (parlando && inPausa) { window.speechSynthesis.resume(); setInPausa(false); }
  };

  const gestisciAudio = () => {
    if (!parlando) return leggi();
    inPausa ? riprendi() : pausa();
  };

  // Blocco navigazione se c'è codiceSessione
  const vaiIndietro = () => { if (!codiceSessione && indiceAttuale > 0) setIndiceAttuale(indiceAttuale - 1); };
  const vaiAvanti = () => { if (!codiceSessione && indiceAttuale < items.length - 1) setIndiceAttuale(indiceAttuale + 1); };

  const cambiaDurata = (verso) => setDurataScelta(d => DURATE[Math.min(Math.max(DURATE.indexOf(d) + verso, 0), DURATE.length - 1)]);
  const cambiaLivello = (verso) => setLivelloScelto(l => LIVELLI[Math.min(Math.max(LIVELLI.indexOf(l) + verso, 0), LIVELLI.length - 1)]);

  const staLeggendo = parlando && !inPausa;

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
    { nome: 'Esci', frasi: ['esci', 'chiudi', 'torna alle visite'], azione: () => navigate('/') },
    ...(tappaCorrente?.indicazioneLogistica ? [
      { nome: 'Come ci arrivo', frasi: ['come ci arrivo', 'come arrivo', 'dove devo andare', 'dove vado'], azione: () => parla(tappaCorrente.indicazioneLogistica) },
    ] : []),
    ...(config?.logistica ? [
      { nome: 'Uscita', frasi: ['uscita'], azione: () => rispondiLogistica('uscita') },
      { nome: 'Toilette', frasi: ['toilette', 'bagno'], azione: () => rispondiLogistica('toilette') },
      { nome: 'Bar', frasi: ['bar'], azione: () => rispondiLogistica('bar') },
      { nome: 'Shop', frasi: ['shop', 'negozio'], azione: () => rispondiLogistica('shop') },
      { nome: 'Ostacoli', frasi: ['ostacol'], azione: () => rispondiLogistica('ostacoli') },
    ] : []),
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
      <div className="bg-light d-flex flex-column position-relative" style={{ width: '100%', maxWidth: '480px', height: '100%' }}>

        {codiceSessione && (
          <div className="bg-primary text-white py-1 px-3 text-center small fw-semibold flex-shrink-0 d-flex justify-content-between align-items-center">
            <span><i className="bi bi-broadcast me-1"></i> Sessione Live: <strong>{codiceSessione}</strong></span>
            <span className="badge text-bg-light text-primary">In Sincronizzazione</span>
          </div>
        )}

        <div className="bg-light border-bottom p-3 d-flex align-items-center flex-shrink-0">
          <div className="d-flex flex-shrink-0" style={{ width: '124px' }}>
            <button
              className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px' }}
              onClick={() => navigate('/')}
              aria-label="Chiudi visita"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="flex-grow-1 text-center px-2" style={{ minWidth: 0 }}>
            <div className="fw-semibold text-truncate">{visita?.nome}</div>
            <div className="small text-muted">{indiceAttuale + 1} / {items.length}</div>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-1 flex-shrink-0" style={{ width: '124px' }}>
            <button
              className={`btn btn-sm ${mostraInfo ? 'btn-primary' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
              style={{ width: '38px', height: '38px' }}
              onClick={() => setMostraInfo(m => !m)}
            >
              <i className="bi bi-info-lg"></i>
            </button>
            {config?.mappa && (
              <button
                className={`btn btn-sm ${mostraMappa ? 'btn-primary' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
                style={{ width: '38px', height: '38px' }}
                onClick={() => setMostraMappa(m => !m)}
              >
                <i className={`bi ${mostraMappa ? 'bi-arrow-left' : 'bi-map'}`}></i>
              </button>
            )}
            {riconoscimentoSupportato && (
              <button
                className={`btn btn-sm ${ascoltando ? 'btn-danger' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
                style={{ width: '38px', height: '38px' }}
                onClick={ascolta}
              >
                <i className={`bi ${ascoltando ? 'bi-mic-fill' : 'bi-mic'}`}></i>
              </button>
            )}
          </div>
        </div>

        {(ascoltando || statoVoce) && (
          <div className="border-bottom px-3 py-2 small text-center flex-shrink-0">
            <span className={ascoltando ? 'fw-semibold' : 'text-muted fst-italic'}>
              {ascoltando ? 'Sto ascoltando...' : statoVoce}
            </span>
          </div>
        )}

        {mostraMappa ? (
          <div className="flex-grow-1" style={{ minHeight: 0, background: '#F4F1E9' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
              <image href={config.mappa} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" />
              {items.map((op, i) => {
                const pos = config.posizioni?.[op?.operaId];
                if (!pos) return null;
                const corrente = i === indiceAttuale;
                return (
                  <g key={op?._id || i} style={{ cursor: codiceSessione ? 'default' : 'pointer' }} onClick={() => !codiceSessione && setIndiceAttuale(i)}>
                    <circle cx={pos.x} cy={pos.y} r={corrente ? 2.6 : 2} fill={corrente ? '#C63A24' : '#F4F1E9'} stroke={corrente ? '#C63A24' : '#8a7f6d'} strokeWidth="0.7" />
                    <text x={pos.x} y={pos.y + 0.9} textAnchor="middle" fontSize="2.5" fontWeight="600" fill={corrente ? '#fff' : '#1B1917'}>{i + 1}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="p-3 flex-grow-1 overflow-auto" style={{ minHeight: 0, overscrollBehavior: 'contain' }}>
            {tappaCorrente?.indicazioneLogistica && (
              <p className="text-center fst-italic text-muted small mb-3">
                {tappaCorrente.indicazioneLogistica}
              </p>
            )}

            <h2 className="fs-4 fw-bold mb-3">
              {itemCorrente?.titolo}
              {tappaCorrente?.opzionale && (
                <span className="badge text-bg-secondary fw-normal fs-6 align-middle ms-2">Opzionale</span>
              )}
            </h2>

            {itemCorrente?.descrizione && (
              <p className="text-muted small mb-3">{itemCorrente.descrizione}</p>
            )}

            {itemCorrente?.immagine ? (
              <img
                src={itemCorrente.immagine}
                alt={itemCorrente.titolo}
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
            </div>
          </div>
        )}

        <div className="bg-light border-top py-2 px-4 d-flex justify-content-between align-items-center flex-shrink-0">
          <button
            className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '46px', height: '46px' }}
            disabled={indiceAttuale === 0 || !!codiceSessione}
            onClick={vaiIndietro}
          >
            <i className="bi bi-skip-start-fill fs-5"></i>
          </button>
          <button
            className={`btn ${testoTrovato ? 'btn-primary' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
            style={{ width: '62px', height: '62px' }}
            disabled={!testoTrovato}
            onClick={gestisciAudio}
          >
            <i className={`bi ${!testoTrovato ? 'bi-volume-mute' : staLeggendo ? 'bi-pause-fill' : 'bi-play-fill'} fs-3`}></i>
          </button>
          <button
            className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '46px', height: '46px' }}
            disabled={indiceAttuale === items.length - 1 || !!codiceSessione}
            onClick={vaiAvanti}
          >
            <i className="bi bi-skip-end-fill fs-5"></i>
          </button>
        </div>

        {mostraInfo && (
          <div className="position-absolute d-flex align-items-center justify-content-center p-3" style={{ inset: 0, zIndex: 20, background: 'rgba(27,25,23,.35)' }} onClick={() => setMostraInfo(false)}>
            <div
              className="bg-light rounded border p-3"
              style={{ width: '100%', maxWidth: '360px', maxHeight: '80%', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="fs-5 fw-bold mb-0">Informazioni utili</h3>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '34px', height: '34px' }}
                  onClick={() => setMostraInfo(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              {visita?.infoLogistiche && <p className="text-muted small mb-2">{visita.infoLogistiche}</p>}
              {LOGISTICA.map(([chiave, etichetta]) => config?.logistica?.[chiave] && (
                <div key={chiave} className="py-2 border-top">
                  <div className="fw-semibold small">{etichetta}</div>
                  <div className="text-muted small">{config.logistica[chiave]}</div>
                </div>
              ))}
              {!visita?.infoLogistiche && !config?.logistica && (
                <p className="text-muted small fst-italic mb-0">Nessuna informazione disponibile.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Player;