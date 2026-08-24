import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getUtenteLoggato } from './auth';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Player from './pages/Player';
import Docente from './pages/Docente';
import Studente from './pages/Studente';

// Catalogo dietro login: senza sessione si finisce sempre su /login
function ProtectedRoute({ children }) {
  return getUtenteLoggato() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/player/:visitaId" element={<ProtectedRoute><Player /></ProtectedRoute>} />
        <Route path="/docente/:visitaId" element={<ProtectedRoute><Docente /></ProtectedRoute>} />
        <Route path="/studente" element={<ProtectedRoute><Studente /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}