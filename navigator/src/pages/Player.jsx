import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAuth } from '../auth';
import { io } from 'socket.io-client';
import QrScanner from 'qr-scanner';

// scale ordinate: i comandi "dimmi di piu/meno" e "piu/troppo semplice" ci si muovono su
const DURATE = ['3s', '15s', '1min', '4min'];
const LIVELLI = ['infantile', 'elementare', 'medio', 'specialistico'];

// strutture del museo: chiavi del blocco logistica del config, per pannello info e comandi "dov'e X"
const LOGISTICA = [
  ['uscita', 'Uscita', ['uscita']],
  ['toilette', 'Toilette', ['toilette', 'bagno']],
  ['bar', 'Bar', ['bar']],
  ['shop', 'Shop', ['shop', 'negozio']],
  ['ostacoli', 'Ostacoli e accessibilita', ['ostacol']],
];

function Player() {
  const { visitaId: visitaIdParam } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codiceSessione = searchParams.get('sessione');
  const nomeStudente = searchParams.get('nome');

  // Gestione ID visita dinamico (se è 'live', verrà inviato dal socket)
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

  const [mostraScanner, setMostraScanner] = useState(false);
  const [esitoScansione, setEsitoScansione] = useState('');
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // --- INIZIO AGGIUNTE LIVE/QUIZ ---
  const [faseQuiz, setFaseQuiz] = useState(false);
  const [quizDati, setQuizDati] = useState(null);
  const [risposteStudente, setRisposteStudente] = useState({});
  const [votoCalcolato, setVotoCalcolato] = useState(null);

  // Modifica per notificare il docente quando lo studente cambia livello/durata (Obiettivo 3)
  useEffect(() => {
    if (codiceSessione && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('studente:cambiaLivello', {
        codice: codiceSessione,
        livello: livelloScelto,
        durata: durataScelta
      });
    }
  }, [livelloScelto, durataScelta, codiceSessione]);
  // --- FINE AGGIUNTE ---

  useEffect(() => {
    if (!visitaIdAttiva) return; // Aspetta l'ID dal socket se siamo in modalità live
    setLoading(true);
    fetchAuth(`/api/visite/${visitaIdAttiva}`)
      .then(res => res.json())
      .then(data => setVisita(data))
      .finally(() => setLoading(false));
  }, [visitaIdAttiva]);

  // Gestione connessione Socket.io con i nomi attesi dal backend
  useEffect(() => {
    if (!codiceSessione) return;

    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      // Il backend si aspetta 'studente:entra' e richiede un parametro 'nome'
      socket.emit('studente:entra', { codice: codiceSessione, nome: nomeStudente });
    });

    // Il backend inoltra il cambio slide usando 'stato:item'
    socket.on('stato:item', (dati) => {
      if (dati) {
        if (typeof dati.indice === 'number') {
          setIndiceAttuale(dati.indice);
        }
        // Se il server manda l'ID della visita e differisce da quello corrente, lo aggiorniamo
        if (dati.visitaId) {
          setVisitaIdAttiva(prevId => prevId !== dati.visitaId ? dati.visitaId : prevId);
        }
      }
    });

    // --- INIZIO AGGIUNTE LIVE/QUIZ (nel socket) ---
    socket.on('quiz:inizio', (dati) => {
      // Accetta sia dati.domande (struttura inviata da Docente) che dati.quiz
      const domandeRicevute = dati?.domande || dati?.quiz;
      if (domandeRicevute) {
        setQuizDati(domandeRicevute);
        setFaseQuiz(true);
        window.speechSynthesis.cancel();
        riconoscimentoRef.current?.abort();
      }
    });
    // --- FINE AGGIUNTE ---

    return () => {
      socket.disconnect();
    };
  }, [codiceSessione, nomeStudente]);

  // il museo indica (campo configFile) quale file caricare: mappa + posizioni + logistica
  useEffect(() => {
    const file = visita?.museoId?.configFile;
    if (!file) return;
    fetch(`/config/${file}`)
      .then(res => res.ok ? res.json() : null)
      .then(setConfig);
  }, [visita]);

  // le voci del browser arrivano in modo asincrono: tengo quelle italiane e ne scelgo una
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

  // se cambia item o combinazione livello/durata, azzero l'audio in corso
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

  // Il QR appeso di fianco all'opera contiene il codice Wikidata (operaId), niente altro.
  // Se quell'opera e' una tappa di questa visita ci salto sopra; se e' del museo ma non del
  // percorso lo dico e basta: gli item si comprano con la visita che li contiene, mostrarli
  // qui vorrebbe dire regalarli.
  const gestisciCodice = async (codice) => {
    const tappeVisita = (visita?.items ?? []).filter(tappa => tappa.itemId);
    const indice = tappeVisita.findIndex(tappa => tappa.itemId.operaId === codice);
    if (indice !== -1) {
      setMostraScanner(false);
      setIndiceAttuale(indice);
      return;
    }
    const risposta = await fetchAuth(`/api/items?operaId=${codice}`);
    const trovati = await risposta.json();
    setEsitoScansione(trovati.length > 0
      ? `"${trovati[0].titolo}" non fa parte di questa visita.`
      : 'Questo codice non corrisponde a nessuna opera.');
  };

  // La fotocamera vuole un contesto sicuro: funziona su https e su localhost, non su un IP di rete.
  useEffect(() => {
    if (!mostraScanner || !videoRef.current) return;
    const scanner = new QrScanner(videoRef.current, (esito) => gestisciCodice(esito.data), {
      highlightScanRegion: true,
    });
    scanner.start().catch(() => setEsitoScansione('Non riesco ad aprire la fotocamera.'));
    scannerRef.current = scanner;
    return () => { scanner.destroy(); scannerRef.current = null; };
  }, [mostraScanner]);

  // visita.items sono le TAPPE del percorso: { itemId, ordine, opzionale, indicazioneLogistica }.
  // L'item vero sta dentro itemId, ma indicazione e opzionale stanno sulla tappa, quindi
  // tengo tutte e due le liste. Se un item e' stato cancellato dal marketplace la populate
  // restituisce null e scarto la tappa intera.
  const tappe = (visita?.items ?? []).filter(tappa => tappa.itemId);
  const items = tappe.map(tappa => tappa.itemId);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (items.length === 0) return <div className="alert alert-warning m-3 text-center">Nessun item presente in questo percorso.</div>;

  const itemCorrente = items[indiceAttuale];
  const tappaCorrente = tappe[indiceAttuale];

  // tra i testi dell'item cerco quello che combacia con livello e durata scelti
  const testoTrovato = itemCorrente?.testi?.find(
    t => t.livello === livelloScelto && t.durata === durataScelta
  );

  // pronuncia un testo con la prima voce italiana disponibile; onEnd opzionale
  const parla = (testo, onEnd) => {
    window.speechSynthesis.cancel();
    const voce = new SpeechSynthesisUtterance(testo);
    voce.lang = 'it-IT';
    if (voci[0]) voce.voice = voci[0];
    if (onEnd) voce.onend = onEnd;
    window.speechSynthesis.speak(voce);
  };

  // azioni: le richiamano sia i bottoni sia i comandi vocali
  const leggi = () => {
    if (!testoTrovato) return;
    // mentre cammini guardi il museo, non lo schermo: prima come arrivarci, poi l'opera
    const indicazione = tappaCorrente?.indicazioneLogistica;
    const daLeggere = indicazione ? `${indicazione}. ${testoTrovato.testo}` : testoTrovato.testo;
    parla(daLeggere, () => { setParlando(false); setInPausa(false); });
    setParlando(true);
    setInPausa(false);
  };

  // risposta a un comando vocale: apre il pannello, cosi' il testo resta anche a schermo,
  // e lo pronuncia.
  const rispondi = (testo) => {
    setMostraInfo(true);
    parla(testo);
  };

  // etichetta, testo, frase pronunciata dal comando vocale, frasi che lo attivano.
  // righeOpera sta solo fra i comandi vocali: autore e data sono gia' nella didascalia
  // sotto al titolo, ripeterli nel pannello era un doppione.
  const righeOpera = [
    ['Autore', itemCorrente?.autoreOpera, `L'autore è ${itemCorrente?.autoreOpera}`, ['autore', 'dipinto']],
    ['Stile', itemCorrente?.stile, `Lo stile è ${itemCorrente?.stile}`, ['stile', 'movimento']],
  ].filter(([, testo]) => testo);

  // righeMuseo invece compare in tutti e due i posti: aggiungere una voce a LOGISTICA
  // la fa apparire sia nel pannello sia fra i comandi.
  const righeMuseo = LOGISTICA
    .map(([chiave, etichetta, frasi]) => [etichetta, config?.logistica?.[chiave], config?.logistica?.[chiave], frasi])
    .filter(([, testo]) => testo);

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

  // durante una lezione la tappa la decide il docente: lo studente non si sposta da solo
  const vaiIndietro = () => { if (!codiceSessione && indiceAttuale > 0) setIndiceAttuale(indiceAttuale - 1); };
  const vaiAvanti = () => { if (!codiceSessione && indiceAttuale < items.length - 1) setIndiceAttuale(indiceAttuale + 1); };

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
    { nome: 'Esci', frasi: ['esci', 'chiudi', 'torna alle visite'], azione: () => navigate('/') },
    ...(tappaCorrente?.indicazioneLogistica ? [
      { nome: 'Come ci arrivo', frasi: ['come ci arrivo', 'come arrivo', 'dove devo andare', 'dove vado'], azione: () => parla(tappaCorrente.indicazioneLogistica) },
    ] : []),
    // stessa fonte per bottoni e voce: ogni riga del pannello e' anche un comando vocale
    ...[...righeOpera, ...righeMuseo].map(([nome, , dettato, frasi]) => ({ nome, frasi, azione: () => rispondi(dettato) })),
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

  // push-to-talk: tocco il microfono, dico un comando, si ferma da solo dopo la frase.
  // Il tasto c'e' sempre: su Firefox, che non ha SpeechRecognition, dice perche' non funziona
  // invece di sparire (un tasto che manca sembra un guasto, uno che si spiega no).
  const ascolta = () => {
    const Riconoscimento = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Riconoscimento) {
      setStatoVoce('I comandi vocali funzionano su Chrome: questo browser non li supporta.');
      return;
    }
    if (ascoltando) { riconoscimentoRef.current?.abort(); return; }
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

  // --- INIZIO AGGIUNTE LIVE/QUIZ (Funzioni) ---
  const inviaQuiz = () => {
    if (!quizDati) return;
    let corrette = 0;
    const arrayRisposte = quizDati.map((domanda, index) => {
      // Correzione: Docente.jsx invia la risposta corretta nella chiave "esatta"
      const isCorretta = risposteStudente[index] === domanda.esatta;
      if (isCorretta) corrette++;
      return { indiceDomanda: index, rispostaData: risposteStudente[index], corretta: isCorretta };
    });

    const votoInDecimi = Math.round((corrette / quizDati.length) * 10);
    setVotoCalcolato(votoInDecimi);

    if (socketRef.current) {
      socketRef.current.emit('studente:invioQuiz', {
        codice: codiceSessione,
        risposte: arrayRisposte,
        totaleDomande: quizDati.length,
        corrette: corrette
      });
    }
  };

  if (faseQuiz) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', overflow: 'hidden', background: 'var(--bs-body-color)' }}>
        <div className="bg-light d-flex flex-column p-4" style={{ width: '100%', maxWidth: '480px', height: '100%', overflowY: 'auto' }}>
          <h2 className="fs-3 fw-bold mb-4 text-center text-primary">Test Finale</h2>
          
          {votoCalcolato !== null ? (
            <div className="text-center mt-5">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
              <h3 className="mt-3">Test Completato!</h3>
              <p className="fs-4">Il tuo voto è: <strong>{votoCalcolato} / 10</strong></p>
              <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Torna alla Home</button>
            </div>
          ) : (
            <>
              {quizDati?.map((domanda, index) => (
                <div key={index} className="mb-4 bg-white p-3 rounded border shadow-sm">
                  <p className="fw-semibold mb-3">{index + 1}. {domanda.quesito}</p>
                  <div className="d-flex flex-column gap-2">
                    {domanda.opzioni.map((opzione, opzIndex) => (
                      <button
                        key={opzIndex}
                        className={`btn text-start ${risposteStudente[index] === opzIndex ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setRisposteStudente(prev => ({ ...prev, [index]: opzIndex }))}
                      >
                        {opzione}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button 
                className="btn btn-success btn-lg mt-3 w-100 fw-bold" 
                disabled={Object.keys(risposteStudente).length !== quizDati?.length}
                onClick={inviaQuiz}
              >
                Consegna Test
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  // --- FINE AGGIUNTE ---

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
              aria-label="Informazioni utili"
            >
              <i className="bi bi-info-lg"></i>
            </button>
            {config?.mappa && (
              <button
                className={`btn btn-sm ${mostraMappa ? 'btn-primary' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
                style={{ width: '38px', height: '38px' }}
                onClick={() => setMostraMappa(m => !m)}
                aria-label={mostraMappa ? 'Torna alla lettura' : 'Mappa'}
              >
                <i className={`bi ${mostraMappa ? 'bi-arrow-left' : 'bi-map'}`}></i>
              </button>
            )}
            <button
              className={`btn btn-sm ${ascoltando ? 'btn-danger' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
              style={{ width: '38px', height: '38px' }}
              onClick={ascolta}
              aria-label={ascoltando ? 'Ferma ascolto' : 'Comando vocale'}
            >
              <i className={`bi ${ascoltando ? 'bi-mic-fill' : 'bi-mic'}`}></i>
            </button>
            <button
              className={`btn btn-sm ${mostraScanner ? 'btn-primary' : 'btn-outline-secondary'} rounded-circle d-flex align-items-center justify-content-center`}
              style={{ width: '38px', height: '38px' }}
              onClick={() => { setEsitoScansione(''); setMostraMappa(false); setMostraScanner(v => !v); }}
              aria-label={mostraScanner ? 'Chiudi la fotocamera' : "Inquadra il QR di un'opera"}
            >
              <i className={`bi ${mostraScanner ? 'bi-x-lg' : 'bi-qr-code-scan'}`}></i>
            </button>
          </div>
        </div>

        {(ascoltando || statoVoce) && (
          <div className="border-bottom px-3 py-2 small text-center flex-shrink-0">
            <span className={ascoltando ? 'fw-semibold' : 'text-muted fst-italic'}>
              {ascoltando ? 'Sto ascoltando...' : statoVoce}
            </span>
          </div>
        )}

        {mostraScanner ? (
          <div className="flex-grow-1 d-flex flex-column" style={{ minHeight: 0, background: '#1B1917' }}>
            <video ref={videoRef} className="flex-grow-1" style={{ minHeight: 0, width: '100%', objectFit: 'cover' }} />
            <p className="text-center text-white-50 small mb-0 px-3 py-2">
              {esitoScansione || "Inquadra il codice QR appeso di fianco all'opera."}
            </p>
          </div>
        ) : mostraMappa ? (
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

            {/* la didascalia da cartellino: autore, data, tecnica */}
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
            aria-label="Item precedente"
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
            disabled={indiceAttuale === items.length - 1 || !!codiceSessione}
            onClick={vaiAvanti}
            aria-label="Item successivo"
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
                  aria-label="Chiudi"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              {righeMuseo.map(([etichetta, testo]) => (
                <div key={etichetta} className="py-2 border-top">
                  <div className="fw-semibold small">{etichetta}</div>
                  <div className="text-muted small">{testo}</div>
                </div>
              ))}
              {righeMuseo.length === 0 && (
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