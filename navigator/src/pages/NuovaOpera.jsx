import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import Navbar from '../components/Navbar';

export default function NuovaOpera() {
  const { id: visitaId } = useParams(); // ID del museo/visita
  const navigate = useNavigate();

  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrore('');

    try {
      // Questi campi devono corrispondere ESATTAMENTE allo schema del backend
      const datiDaInviare = {
        titolo: titolo,
        descrizione: descrizione, 
        museoId: visitaId, // Assumiamo che l'id nella URL sia il museoId
        operaId: "Q000000", // Placeholder, cambia se lo recuperi dinamicamente
        licenza: "CC BY 4.0"
        // Nota: autoreId solitamente viene aggiunto dal backend tramite il token di sessione
      };

      const res = await fetchAuth('/items', {
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
      <div className="container" style={{ maxWidth: '600px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-sm fw-bold mb-4">
          ← Annulla
        </button>

        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h3 className="card-title fw-bold mb-4">Aggiungi Nuova Opera</h3>
            {errore && <div className="alert alert-danger py-2">{errore}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary">Titolo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={titolo} 
                  onChange={e => setTitolo(e.target.value)} 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold text-secondary">Descrizione</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  value={descrizione} 
                  onChange={e => setDescrizione(e.target.value)} 
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-100 py-2 fw-bold" 
                disabled={loading}
              >
                {loading ? 'Salvataggio...' : 'Aggiungi Opera'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}