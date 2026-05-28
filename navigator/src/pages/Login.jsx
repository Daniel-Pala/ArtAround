import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrore(data.message || 'Credenziali errate');
        return;
      }

      localStorage.setItem('utente', JSON.stringify({
        userId: data.userId,
        username: data.username,
        ruolo: data.ruolo,
        token: data.token
      }));
      
      navigate('/');
    } catch (err) {
      setErrore('Server backend non raggiungibile');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-4">
          <h3 className="card-title text-center mb-4">Accedi ad ArtAround</h3>
          
          {errore && (
            <div className="alert alert-danger py-2 text-center" role="alert">
              {errore}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label text-muted small mb-1">Username</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Inserisci il tuo username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted small mb-1">Password</label>
              <input 
                type="password" 
                className="form-control"
                placeholder="Inserisci la password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold">
              Accedi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}