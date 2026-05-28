import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAuth } from '../auth';
import Navbar from '../components/Navbar';

export default function Opere() {
  const { id: visitaId } = useParams();
  const navigate = useNavigate();
  const [opere, setOpere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    async function caricaOpere() {
      try {
        const res = await fetchAuth(`/items?visitaId=${visitaId}`);
        
        if (!res.ok) throw new Error('Errore nel caricamento opere');
        
        const data = await res.json();
        setOpere(data);
      } catch (err) {
        setErrore(err.message);
      } finally {
        setLoading(false);
      }
    }
    caricaOpere();
  }, [visitaId]);

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button onClick={() => navigate(-1)} className="btn btn-outline-secondary">← Indietro</button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate(`/percorso/${visitaId}/nuova-opera`)}
          >
            + Nuova Opera
          </button>
        </div>

        {errore && <div className="alert alert-danger">{errore}</div>}
        {loading ? (
          <p>Caricamento...</p>
        ) : (
          <div className="row">
            {opere.map(opera => (
              <div key={opera._id} className="col-md-4 mb-3">
                <Link to={`/opera/${opera._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card h-100 shadow-sm hover-shadow">
                    <div className="card-body">
                      <h5 className="card-title fw-bold">{opera.titolo}</h5>
                      <p className="card-text text-muted small">{opera.descrizione}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}