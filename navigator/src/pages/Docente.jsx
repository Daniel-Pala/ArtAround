import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import { io } from 'socket.io-client';

export default function Docente() {
  const { visitaId } = useParams();
  const navigate = useNavigate();

  const [visita, setVisita] = useState(null);
  const [codiceInput, setCodiceInput] = useState('');
  const [codiceAttivo, setCodiceAttivo] = useState(null);
  const [indiceAttuale, setIndiceAttuale] = useState(0);
  const [studenti, setStudenti] = useState([]);
  const [attivitaLog, setAttivitaLog] = useState([]);
  const [risultatiQuiz, setRisultatiQuiz] = useState([]);
  const [quizInCorso, setQuizInCorso] = useState(false);
  const [votiSalvati, setVotiSalvati] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    fetchAuth(`/api/visite/${visitaId}`)
      .then(res => res.json())
      .then(data => {
        setVisita(data);
        // Pre-imposta il codice mnemonico se è stato configurato nel marketplace
        if (data.codiceMnemonico) {
          setCodiceInput(data.codiceMnemonico.toUpperCase());
        } else {
          setCodiceInput('FENICE-ROSSA'); // Fallback
        }
      });

    const socket = io();
    socketRef.current = socket;

    socket.on('sessione:creata', ({ codice }) => setCodiceAttivo(codice));
    socket.on('sessione:studenti', (lista) => setStudenti(lista || []));
    socket.on('docente:nuovaAttivita', (act) => {
      setAttivitaLog(prev => [act, ...prev.slice(0, 19)]);
    });
    socket.on('docente:risultatiQuiz', (risultati) => setRisultatiQuiz(risultati));

    return () => socket.disconnect();
  }, [visitaId]);

  const creaSessione = () => {
    // AGGIORNATO: allineato il nome della proprietà con backend (codiceMnemonico)
    socketRef.current?.emit('docente:crea', { visitaId, codiceMnemonico: codiceInput });
  };

  const tappe = (visita?.items ?? []).filter(tappa => tappa.itemId);
  const itemCorrente = tappe[indiceAttuale]?.itemId;

  const cambiaTappa = (nuovoIndice) => {
    if (nuovoIndice < 0 || nuovoIndice >= tappe.length) return;
    setIndiceAttuale(nuovoIndice);
    socketRef.current?.emit('docente:vaiA', { codice: codiceAttivo, indice: nuovoIndice });
  };

  // --- NUOVA FUNZIONE: Trigger Audio Studenti ---
  const forzaAudioStudenti = () => {
    socketRef.current?.emit('docente:forzaAudio', { codice: codiceAttivo });
    
    // Aggiungo un log locale per feedback visivo alla docente
    const logLocale = {
      nome: 'Docente',
      tipo: 'Azione',
      dettaglio: 'Ha forzato la riproduzione audio per tutta la classe',
      orario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setAttivitaLog(prev => [logLocale, ...prev.slice(0, 19)]);
  };

  const avviaQuizGenerico = () => {
    // Utilizza il quiz configurato nel marketplace se presente,
    // altrimenti usa le domande di default basate sulle tappe per la verifica finale
    const domandeQuiz = (visita?.quiz && visita.quiz.length > 0)
      ? visita.quiz.map((q, idx) => ({
          id: idx,
          quesito: q.quesito,
          opzioni: q.opzioni,
          esatta: q.rispostaCorretta
        }))
      : tappe.map((t, idx) => ({
          id: idx,
          quesito: `Qual è il tema principale dell'opera "${t.itemId?.titolo}"?`,
          opzioni: [t.itemId?.stile || 'Arte Moderna', 'Tecnica Classica', 'Contesto Storico', 'Nessuna delle precedenti'],
          esatta: 0
        }));

    socketRef.current?.emit('docente:avviaQuiz', { codice: codiceAttivo, domande: domandeQuiz });
    setQuizInCorso(true);
  };

  // --- NUOVA FUNZIONE: Salvataggio Voti nel Database ---
  const salvaVoti = async () => {
    try {
      const response = await fetchAuth(`/api/visite/${visitaId}/voti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          codiceSessione: codiceAttivo,
          risultati: risultatiQuiz 
        })
      });
      
      if (response.ok) {
        setVotiSalvati(true);
      } else {
        alert("Errore durante il salvataggio dei voti.");
      }
    } catch (error) {
      console.error("Errore di connessione:", error);
      alert("Impossibile connettersi al database per salvare i voti.");
    }
  };

  // --- NUOVA FUNZIONE: Chiusura Stanza sicura con salvataggio ---
  const chiudiSessione = async () => {
    if (risultatiQuiz.length > 0 && !votiSalvati) {
      await salvaVoti(); // Salva in automatico se i voti ci sono ma la docente ha dimenticato di premere il bottone
    }
    
    socketRef.current?.emit('docente:chiudi', { codice: codiceAttivo });
    
    // Reset dello stato locale
    setCodiceAttivo(null);
    setStudenti([]);
    setRisultatiQuiz([]);
    setQuizInCorso(false);
    setVotiSalvati(false);
    setAttivitaLog([]);
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '700px' }}>
      {!codiceAttivo ? (
        <div className="card p-4 shadow-sm text-center">
          <h3 className="fw-bold mb-3">Crea Sessione Live</h3>
          <p className="text-muted small">Inserisci un codice mnemonico per la classe (es. FENICE-ROSSA):</p>
          <input 
            type="text" 
            className="form-control form-control-lg text-center fw-bold mb-3" 
            value={codiceInput} 
            onChange={(e) => setCodiceInput(e.target.value.toUpperCase())} 
          />
          <button className="btn btn-danger btn-lg w-100 fw-bold" onClick={creaSessione}>Avvia Lezione</button>
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card p-3 shadow-sm text-center">
              <span className="text-muted small">Codice Sessione</span>
              <h2 className="fw-bold text-danger display-6 mb-2">{codiceAttivo}</h2>
              <span className="badge bg-secondary mb-3">{studenti.filter(s => s.online !== false).length} Studenti Connessi</span>

              <div className="d-flex flex-wrap gap-1 justify-content-center mb-3">
                {studenti.map((s, i) => (
                  // AGGIORNATO: Rendering dinamico per segnalare visivamente chi è temporaneamente caduto dalla rete
                  <span key={i} className={`badge ${s.online !== false ? 'bg-light text-dark border' : 'bg-secondary text-white border-secondary'}`}>
                    <i className={`bi ${s.online !== false ? 'bi-person' : 'bi-person-slash'} me-1`}></i>
                    {s.nome} {s.online === false && <span className="ms-1 fst-italic opacity-75">Offline</span>}
                  </span>
                ))}
              </div>

              <button className="btn btn-warning w-100 fw-bold mb-2" onClick={avviaQuizGenerico} disabled={quizInCorso}>
                <i className="bi bi-patch-check me-2"></i>{quizInCorso ? 'Quiz In Corso...' : 'Lancia Quiz Finale'}
              </button>
            </div>

            {/* MONITORAGGIO RICHIESTE IN TEMPO REALE */}
            <div className="card p-3 shadow-sm mt-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <h6 className="fw-bold text-muted border-bottom pb-2">Feed Attenzione & Richieste</h6>
              {attivitaLog.length === 0 ? (
                <span className="small text-muted fst-italic">Nessuna interazione registrata...</span>
              ) : (
                attivitaLog.map((act, i) => (
                  <div key={i} className="small border-bottom py-1">
                    <strong className="text-primary">{act.nome}</strong>: {act.tipo} ({act.dettaglio}) <span className="text-muted fs-7">[{act.orario}]</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-3 shadow-sm text-center">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-danger">Controllo Tappe</span>
                <span className="small fw-bold">{indiceAttuale + 1} / {tappe.length}</span>
              </div>
              <h5 className="fw-bold">{itemCorrente?.titolo}</h5>
              
              {itemCorrente?.immagine && (
                <img src={itemCorrente.immagine} alt={itemCorrente.titolo} className="img-fluid rounded mb-3 mx-auto d-block" style={{ height: '140px', objectFit: 'cover' }} />
              )}
              
              {/* Bottone per forzare l'audio a tutti gli studenti connessi */}
              <button 
                className="btn btn-primary w-100 fw-bold mb-3 d-flex align-items-center justify-content-center gap-2"
                onClick={forzaAudioStudenti}
                disabled={quizInCorso}
              >
                <i className="bi bi-megaphone-fill"></i> Fai partire l'audio a tutti
              </button>

              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary flex-grow-1" disabled={indiceAttuale === 0 || quizInCorso} onClick={() => cambiaTappa(indiceAttuale - 1)}>← Precedente</button>
                <button className="btn btn-danger flex-grow-1" disabled={indiceAttuale === tappe.length - 1 || quizInCorso} onClick={() => cambiaTappa(indiceAttuale + 1)}>Successiva →</button>
              </div>
            </div>

            {/* TABELLA VOTI QUIZ E SALVATAGGIO */}
            {risultatiQuiz.length > 0 && (
              <div className="card p-3 shadow-sm mt-3">
                <h6 className="fw-bold text-muted border-bottom pb-2">Risultati e Voti Quiz</h6>
                <div className="table-responsive mb-2">
                  <table className="table table-sm text-center mb-0">
                    <thead><tr><th>Studente</th><th>Esito</th><th>Voto</th></tr></thead>
                    <tbody>
                      {risultatiQuiz.map((r, i) => (
                        <tr key={i}>
                          <td>{r.nome}</td>
                          <td>{r.punteggio}/{r.totale}</td>
                          <td><span className={`badge ${r.voto >= 6 ? 'bg-success' : 'bg-danger'}`}>{r.voto}/10</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button 
                  className={`btn ${votiSalvati ? 'btn-success' : 'btn-outline-primary'} w-100 fw-bold mt-2`} 
                  onClick={salvaVoti}
                  disabled={votiSalvati}
                >
                  {votiSalvati ? (
                    <><i className="bi bi-check-circle-fill me-2"></i> Voti Salvati</>
                  ) : (
                    <><i className="bi bi-cloud-arrow-up-fill me-2"></i> Salva Voti nel Database</>
                  )}
                </button>
              </div>
            )}
            
            <button className="btn btn-outline-danger w-100 fw-bold mt-3" onClick={chiudiSessione}>
              <i className="bi bi-x-circle me-2"></i> Termina Lezione
            </button>
          </div>
        </div>
      )}
    </div>
  );
}