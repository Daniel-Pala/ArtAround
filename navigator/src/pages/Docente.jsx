import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import { io } from 'socket.io-client';

export default function Docente() {
  const { visitaId } = useParams();
  const navigate = useNavigate();

  const [visita, setVisita] = useState(null);
  const [codiceInput, setCodiceInput] = useState('FENICE-ROSSA');
  const [codiceAttivo, setCodiceAttivo] = useState(null);
  const [indiceAttuale, setIndiceAttuale] = useState(0);
  const [studenti, setStudenti] = useState([]);
  const [attivitaLog, setAttivitaLog] = useState([]);
  const [risultatiQuiz, setRisultatiQuiz] = useState([]);
  const [quizInCorso, setQuizInCorso] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    fetchAuth(`/api/visite/${visitaId}`)
      .then(res => res.json())
      .then(data => setVisita(data));

    const socket = io('http://localhost:3000');
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
    socketRef.current?.emit('docente:crea', { visitaId, codicePersonalizzato: codiceInput });
  };

  const tappe = (visita?.items ?? []).filter(tappa => tappa.itemId);
  const itemCorrente = tappe[indiceAttuale]?.itemId;

  const cambiaTappa = (nuovoIndice) => {
    if (nuovoIndice < 0 || nuovoIndice >= tappe.length) return;
    setIndiceAttuale(nuovoIndice);
    socketRef.current?.emit('docente:vaiA', { codice: codiceAttivo, indice: nuovoIndice });
  };

  const avviaQuizGenerico = () => {
    // Domande di default basate sulle tappe per la verifica finale
    const domandeDefault = tappe.map((t, idx) => ({
      id: idx,
      quesito: `Qual è il tema principale dell'opera "${t.itemId?.titolo}"?`,
      opzioni: [t.itemId?.stile || 'Arte Moderna', 'Tecnica Classica', 'Contesto Storico', 'Nessuna delle precedenti'],
      esatta: 0
    }));

    socketRef.current?.emit('docente:avviaQuiz', { codice: codiceAttivo, domande: domandeDefault });
    setQuizInCorso(true);
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
              <span className="badge bg-secondary mb-3">{studenti.length} Studenti Connessi</span>

              <div className="d-flex flex-wrap gap-1 justify-content-center mb-3">
                {studenti.map((s, i) => (
                  <span key={i} className="badge bg-light text-dark border"><i className="bi bi-person me-1"></i>{s.nome}</span>
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
            <div className="card p-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-danger">Controllo Tappe</span>
                <span className="small fw-bold">{indiceAttuale + 1} / {tappe.length}</span>
              </div>
              <h5 className="fw-bold">{itemCorrente?.titolo}</h5>
              {itemCorrente?.immagine && (
                <img src={itemCorrente.immagine} alt={itemCorrente.titolo} className="img-fluid rounded mb-3" style={{ height: '140px', objectFit: 'cover' }} />
              )}
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary flex-grow-1" disabled={indiceAttuale === 0} onClick={() => cambiaTappa(indiceAttuale - 1)}>←</button>
                <button className="btn btn-danger flex-grow-1" disabled={indiceAttuale === tappe.length - 1} onClick={() => cambiaTappa(indiceAttuale + 1)}>→</button>
              </div>
            </div>

            {/* TABELLA VOTI QUIZ */}
            {risultatiQuiz.length > 0 && (
              <div className="card p-3 shadow-sm mt-3">
                <h6 className="fw-bold text-muted border-bottom pb-2">Risultati e Voti Quiz</h6>
                <div className="table-responsive">
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}