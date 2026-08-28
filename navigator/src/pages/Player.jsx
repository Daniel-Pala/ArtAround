import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAuth } from '../auth';
import { io } from 'socket.io-client';

const DURATE = ['3s', '15s', '1min', '4min'];
const LIVELLI = ['infantile', 'elementare', 'medio', 'specialistico'];

export default function Player() {
  const { visitaId: visitaIdParam } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codiceSessione = searchParams.get('sessione');
  const nomeStudente = searchParams.get('nome') || 'Studente';

  const [visitaIdAttiva, setVisitaIdAttiva] = useState(visitaIdParam !== 'live' ? visitaIdParam : null);
  const [visita, setVisita] = useState(null);
  const [loading, setLoading] = useState(true);

  const [indiceAttuale, setIndiceAttuale] = useState(0);
  const [livelloScelto, setLivelloScelto] = useState('medio');
  const [durataScelta, setDurataScelta] = useState('15s');

  const [quizAttivo, setQuizAttivo] = useState(null);
  const [risposteQuiz, setRisposteQuiz] = useState({});
  const [quizCompletato, setQuizCompletato] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!visitaIdAttiva) return;
    fetchAuth(`/api/visite/${visitaIdAttiva}`)
      .then(res => res.json())
      .then(data => setVisita(data))
      .finally(() => setLoading(false));
  }, [visitaIdAttiva]);

  // Gestione Connessione Live e Ricezione Quiz
  useEffect(() => {
    if (!codiceSessione) return;
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('studente:entra', { codice: codiceSessione, nome: nomeStudente });
    });

    socket.on('stato:item', (dati) => {
      if (dati?.indice !== undefined) setIndiceAttuale(dati.indice);
      if (dati?.visitaId) setVisitaIdAttiva(dati.visitaId);
    });

    socket.on('quiz:avvia', ({ domande }) => {
      setQuizAttivo(domande);
    });

    return () => socket.disconnect();
  }, [codiceSessione, nomeStudente]);

  // Invio notifiche attività al docente
  const notificaAttivita = (tipo, dettaglio) => {
    if (codiceSessione && socketRef.current) {
      socketRef.current.emit('studente:azione', {
        codice: codiceSessione,
        nome: nomeStudente,
        tipo,
        dettaglio
      });
    }
  };

  const cambiaLivello = (nuovoLivello) => {
    setLivelloScelto(nuovoLivello);
    notificaAttivita('Cambio Livello', nuovoLivello);
  };

  const cambiaDurata = (nuovaDurata) => {
    setDurataScelta(nuovaDurata);
    notificaAttivita('Cambio Durata', nuovaDurata);
  };

  const inviaRisposteQuiz = () => {
    if (!quizAttivo) return;
    let corrette = 0;
    quizAttivo.forEach((q) => {
      if (risposteQuiz[q.id] === q.esatta) corrette++;
    });

    socketRef.current?.emit('studente:inviaQuiz', {
      codice: codiceSessione,
      nome: nomeStudente,
      punteggio: corrette,
      totale: quizAttivo.length
    });
    setQuizCompletato(true);
  };

  const tappe = (visita?.items ?? []).filter(tappa => tappa.itemId);
  const itemCorrente = tappe[indiceAttuale]?.itemId;
  const testoTrovato = itemCorrente?.testi?.find(t => t.livello === livelloScelto && t.durata === durataScelta);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', background: '#212529' }}>
      <div className="bg-light flex-column d-flex position-relative" style={{ width: '100%', maxWidth: '480px', height: '100%' }}>
        
        {/* MODALE / VISTA QUIZ SE ATTIVATO DAL DOCENTE */}
        {quizAttivo ? (
          <div className="p-4 overflow-auto flex-grow-1">
            <h4 className="fw-bold mb-3 text-danger"><i className="bi bi-patch-check me-2"></i>Verifica Finale</h4>
            {!quizCompletato ? (
              <>
                {quizAttivo.map((q, idx) => (
                  <div key={q.id} className="card p-3 mb-3 shadow-sm">
                    <p className="fw-bold mb-2">{idx + 1}. {q.quesito}</p>
                    {q.opzioni.map((opz, iOpt) => (
                      <div className="form-check" key={iOpt}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`q-${q.id}`}
                          id={`q-${q.id}-${iOpt}`}
                          onChange={() => setRisposteQuiz({ ...risposteQuiz, [q.id]: iOpt })}
                        />
                        <label className="form-check-label" htmlFor={`q-${q.id}-${iOpt}`}>{opz}</label>
                      </div>
                    ))}
                  </div>
                ))}
                <button className="btn btn-danger w-100 fw-bold py-2" onClick={inviaRisposteQuiz}>Conferma e Invia Risposte</button>
              </>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-check-circle-fill text-success display-1"></i>
                <h5 className="fw-bold mt-3">Risposte Inviate!</h5>
                <p className="text-muted">Il docente ha ricevuto il tuo test per la valutazione.</p>
              </div>
            )}
          </div>
        ) : (
          /* LEZIONE NORMALE */
          <>
            <div className="bg-light border-bottom p-3 text-center">
              <span className="fw-bold text-truncate d-block">{visita?.nome}</span>
              <small className="text-muted">Tappa {indiceAttuale + 1} di {tappe.length}</small>
            </div>

            <div className="p-3 flex-grow-1 overflow-auto">
              <h3 className="fw-bold">{itemCorrente?.titolo}</h3>
              {itemCorrente?.immagine && (
                <img src={itemCorrente.immagine} alt="" className="img-fluid rounded mb-3 w-100" style={{ maxHeight: '180px', objectFit: 'cover' }} />
              )}
              <p className="lh-sm">{testoTrovato?.testo || 'Nessuna descrizione disponibile per questa combinazione.'}</p>
              
              <div className="row g-2 mt-auto">
                <div className="col-6">
                  <label className="form-label small text-muted">Livello</label>
                  <select className="form-select form-select-sm" value={livelloScelto} onChange={(e) => cambiaLivello(e.target.value)}>
                    {LIVELLI.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small text-muted">Durata</label>
                  <select className="form-select form-select-sm" value={durataScelta} onChange={(e) => cambiaDurata(e.target.value)}>
                    {DURATE.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-light border-top p-3 d-flex justify-content-between">
              <button className="btn btn-outline-secondary" disabled={indiceAttuale === 0 || !!codiceSessione} onClick={() => setIndiceAttuale(i => i - 1)}>Precedente</button>
              <button className="btn btn-outline-secondary" disabled={indiceAttuale === tappe.length - 1 || !!codiceSessione} onClick={() => setIndiceAttuale(i => i + 1)}>Successivo</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}