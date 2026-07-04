import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Percorsi from './pages/Percorsi';
import Player from './pages/Player';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/museo/:id" element={<Percorsi />} />
        <Route path="/player/:visitaId" element={<Player />} />
      </Routes>
    </BrowserRouter>
  );
}
