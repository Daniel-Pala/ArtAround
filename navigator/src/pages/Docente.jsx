import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function Docente() {
  const { visitaId } = useParams();
  const navigate = useNavigate();
  const [codiceStanza, setCodiceStanza] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const nuovoSocket = io('http://localhost:3000');
    setSocket(nuovoSocket);

    nuovoSocket.emit('docente:crea', { visitaId });

    nuovoSocket.on('sessione:creata', (dati) => {
      setCodiceStanza(dati.codice);
    });

    return () => nuovoSocket.disconnect();
  }, [visitaId]);

  return (
    <div className="container mt-5 text-center">
      <h2 className="fw-bold mb-4">Pannello Docente</h2>
      <div className="card shadow-sm mx-auto p-4 bg-light" style={{ maxWidth: '400px' }}>
        <h5 className="text-muted">Fai inserire questo codice agli studenti:</h5>
        <h1 className="display-3 fw-bold text-primary my-3">
          {codiceStanza || '...'}
        </h1>
      </div>
      <button className="btn btn-outline-danger mt-4" onClick={() => navigate(-1)}>
        Chiudi Sessione
      </button>
    </div>
  );
}
export default Docente;