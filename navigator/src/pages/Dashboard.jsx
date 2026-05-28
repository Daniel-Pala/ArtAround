import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAuth, getUtenteLoggato } from '../auth'; 
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [musei, setMusei] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stati per il form di aggiunta museo
  const [showForm, setShowForm] = useState(false);
  const [nuovoNome, setNuovoNome] = useState('');
  const [nuovaDescrizione, setNuovaDescrizione] = useState('');
  
  const navigate = useNavigate();
  const utente = getUtenteLoggato();

  const loadMusei = async () => {
    try {
      setLoading(true);
      const res = await fetchAuth('/api/musei');
      
      if (!res.ok) {
        throw new Error(`Errore HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      setMusei(data);
    } catch (err) {
      console.error('Errore nel caricamento dei musei:', err);
      setError('Impossibile caricare i dati.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMusei();
  }, []);

  const handleCreaMuseo = async (e) => {
    e.preventDefault();
    if (!nuovoNome.trim()) return;

    try {
      const res = await fetchAuth('/api/musei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nuovoNome, descrizione: nuovaDescrizione })
      });

      if (res.ok) {
        setNuovoNome('');
        setNuovaDescrizione('');
        setShowForm(false);
        loadMusei(); // Ricarica la lista aggiornata dal server
      } else {
        alert('Errore durante la creazione del museo');
      }
    } catch (err) {
      console.error('Errore nell\'invio del museo:', err);
    }
  };

  if (loading) return <div className="container mt-5">Caricamento in corso...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Musei Disponibili</h2>
          {/* Mostra il tasto aggiungi solo se l'utente ha ruolo autore */}
          {utente?.ruolo?.toLowerCase() === 'autore' && (
            <button 
              className="btn btn-primary fw-bold" 
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Annulla' : '+ Aggiungi Museo'}
            </button>
          )}
        </div>

        {/* Form condizionale di inserimento Nuovo Museo */}
        {showForm && (
          <div className="card p-4 mb-4 bg-light shadow-sm">
            <h5>Nuovo Museo</h5>
            <form onSubmit={handleCreaMuseo}>
              <div className="mb-3">
                <label className="form-label small fw-bold">Nome Museo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nuovoNome} 
                  onChange={(e) => setNuovoNome(e.target.value)} 
                  required 
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Descrizione</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={nuovaDescrizione} 
                  onChange={(e) => setNuovaDescrizione(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-success btn-sm fw-bold">Salva Museo</button>
            </form>
          </div>
        )}

        {musei.length === 0 ? (
          <div className="alert alert-info">Nessun museo trovato.</div>
        ) : (
          musei.map(museo => (
            <div key={museo._id} className="card shadow-sm mb-3">
              <div className="card-body">
                <h5 className="card-title fw-bold">{museo.nome}</h5>
                <p className="card-text text-secondary">{museo.descrizione || 'Nessuna descrizione'}</p>
                <button
                  className="btn btn-success"
                  onClick={() => navigate(`/museo/${museo._id}`)}
                >
                  Vedi Percorsi
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}