import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAuth } from '../auth';
import Navbar from '../components/Navbar';

function Dashboard() {
  const [visite, setVisite] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAuth('/api/visite/mie-visite')
      
    .then(res => res.json()) // == function(res) { return res.json(); } is equivalent to res => res.json()
      .then(data => {
        //controllo perche potrebbe essere anche errore
        if (Array.isArray(data)) setVisite(data); 
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="section-head mb-4">
          <h1 className="section-title">Le mie visite</h1>
          <p className="section-sub mt-2 mb-0">Tocca una visita per avviarla.</p>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : visite.length === 0 ? (
          <div className="text-muted text-center py-5">
            Non hai ancora sbloccato nessuna visita.<br />
            Acquistane una dal marketplace per iniziare.
          </div>
        ) : (
          <div className="row g-3">
            {visite.map(v => (
              <div key={v._id} className="col-md-6 col-lg-4">
                <article className="card card-interactive h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="eyebrow mb-2">{v.museoId?.nome || 'Museo'}</div>
                    <h5 className="card-title mb-2">{v.nome}</h5>
                    <p className="card-text text-muted small flex-grow-1">{v.infoLogistiche || 'Nessuna informazione logistica.'}</p>
                    <div className="d-flex justify-content-between align-items-end pt-3 border-top">
                      <div>
                        <div className="price-label">Prezzo</div>
                        <div className="price">{v.prezzo ? `${v.prezzo}€` : 'Gratis'}</div>
                      </div>
                      <button className="btn btn-sm btn-success" onClick={() => navigate(`/player/${v._id}`)}>
                        <i className="bi bi-play-fill me-1"></i>Avvia
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default Dashboard;