import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import Navbar from '../components/Navbar';

export default function NuovoPercorso() {
  const { id: museoId } = useParams();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [prezzo, setPrezzo] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrore('');

    try {
      // Usiamo /api/visite perché è la rotta definita in index.js
      const res = await fetchAuth('/api/visite', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome,
          prezzo,
          museoId: museoId
        })
      });

      if (!res.ok) {
        throw new Error('Errore durante il salvataggio');
      }

      navigate(`/museo/${museoId}`);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4" style={{ maxWidth: '600px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline-secondary mb-3">← Annulla</button>
        <div className="card shadow-sm p-4">
          <h3 className="mb-4">Crea Nuovo Percorso</h3>
          {errore && <div className="alert alert-danger">{errore}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label>Nome del Percorso</label>
              <input type="text" className="form-control" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label>Prezzo (€)</label>
              <input type="number" className="form-control" value={prezzo} onChange={e => setPrezzo(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Salvataggio...' : 'Salva Percorso'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}