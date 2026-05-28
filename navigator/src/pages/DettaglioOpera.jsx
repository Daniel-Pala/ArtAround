import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import Navbar from '../components/Navbar';

export default function DettaglioOpera() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opera, setOpera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    async function carica() {
      try {
        setLoading(true);
        const res = await fetchAuth(`/items/${id}`);
        if (!res.ok) throw new Error('Impossibile caricare');
        const data = await res.json();
        setOpera(data);
      } catch (err) { setErrore(err.message); }
      finally { setLoading(false); }
    }
    carica();
  }, [id]);

  const handleElimina = async () => {
    if (!window.confirm("Eliminare quest'opera?")) return;
    try {
      const res = await fetchAuth(`/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore durante eliminazione');
      navigate(-1); // Torna indietro
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div>Caricamento...</div>;
  if (errore) return <div className="alert alert-danger">{errore}</div>;

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between mb-3">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">← Indietro</button>
          <button onClick={handleElimina} className="btn btn-danger">Elimina Opera</button>
        </div>
        
        {opera && (
          <div className="card p-4">
            <h1>{opera.titolo}</h1>
            <p className="lead">{opera.descrizione || "Nessuna descrizione inserita."}</p>
            <p><strong>Licenza:</strong> {opera.licenza}</p>
          </div>
        )}
      </div>
    </div>
  );
}