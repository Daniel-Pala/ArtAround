import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import Navbar from '../components/Navbar';

export default function NuovaOpera() {
  const { id: visitaId } = useParams();
  const navigate = useNavigate();

  // Dati base Opera
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  
  // Dati per il primo Testo Associato (Requisito Player)
  const [durata, setDurata] = useState('15s');
  const [livello, setLivello] = useState('medio');
  const [contenutoTesto, setContenutoTesto] = useState('');

  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrore('');

    try {
      // Costruiamo l'oggetto esattamente come Mongoose se lo aspetta
      const datiDaInviare = {
        titolo: titolo,
        descrizione: descrizione, 
        museoId: visitaId, 
        operaId: `OP-${Math.floor(Math.random() * 10000)}`, // Genera un ID logico univoco
        licenza: "CC BY 4.0",
        // Passiamo l'array con il primo testo compilato
        testi: [{
          durata: durata,
          livello: livello,
          testo: contenutoTesto
        }]
      };

      const res = await fetchAuth('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datiDaInviare)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Errore durante il salvataggio');
      }

      navigate(`/percorso/${visitaId}/opere`);
    } catch (err) {
      setErrore(err.message || 'Errore di connessione al database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4" style={{ maxWidth: '800px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-sm fw-bold mb-3">
          ← Annulla e Torna Indietro
        </button>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-primary text-white py-3">
            <h4 className="mb-0 fw-bold">Aggiungi Nuova Opera</h4>
          </div>
          <div className="card-body p-4 p-md-5">
            {errore && <div className="alert alert-danger py-2">{errore}</div>}
            
            <form onSubmit={handleSubmit}>
              <h5 className="text-secondary border-bottom pb-2 mb-3">1. Informazioni Generali</h5>
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label fw-semibold text-dark">Titolo dell'Opera</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={titolo} 
                    onChange={e => setTitolo(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold text-dark">Descrizione Pubblica</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={descrizione} 
                    onChange={e => setDescrizione(e.target.value)} 
                  />
                </div>
              </div>

              <h5 className="text-secondary border-bottom pb-2 mb-3">2. Configurazione Contenuto (Player)</h5>
              <div className="row g-3 mb-4 bg-light p-3 rounded">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Durata Lettura</label>
                  <select className="form-select" value={durata} onChange={e => setDurata(e.target.value)}>
                    <option value="3s">3 Secondi (Sintesi)</option>
                    <option value="15s">15 Secondi (Breve)</option>
                    <option value="1min">1 Minuto (Normale)</option>
                    <option value="4min">4 Minuti (Approfondito)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Livello Target</label>
                  <select className="form-select" value={livello} onChange={e => setLivello(e.target.value)}>
                    <option value="infantile">Infantile (Bambini)</option>
                    <option value="elementare">Elementare (Scuole)</option>
                    <option value="medio">Medio (Pubblico Generale)</option>
                    <option value="specialistico">Specialistico (Esperti)</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold">Testo di Spiegazione</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="Inserisci il testo che l'utente leggerà per questa combinazione di durata e livello..."
                    value={contenutoTesto} 
                    onChange={e => setContenutoTesto(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold fs-5" disabled={loading}>
                {loading ? 'Salvataggio in corso...' : 'Salva Opera Definitiva'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}