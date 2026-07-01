import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importazione di tutte le pagine reali presenti nel tuo progetto
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Percorsi from './pages/Percorsi';
import Opere from './pages/Opere';
import NuovaOpera from './pages/NuovaOpera';
import DettaglioOpera from './pages/DettaglioOpera';
import NuovoPercorso from './pages/NuovoPercorso';

// Importazione della nuova applicazione mobile-first
import Player from './pages/Player';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pagina principale: Lista dei Musei e Creazione Musei */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rotte per i Percorsi del museo */}
        <Route path="/museo/:id" element={<Percorsi />} />
        <Route path="/percorsi/:id" element={<Percorsi />} />
        
        {/* Rotte per la creazione di percorsi e gestione opere */}
        <Route path="/museo/:id/nuovo-percorso" element={<NuovoPercorso />} />
        <Route path="/percorso/:id/opere" element={<Opere />} />
        <Route path="/percorso/:id/nuova-opera" element={<NuovaOpera />} />
        <Route path="/opera/:id" element={<DettaglioOpera />} />
        
        {/* Nuova rotta per il Player dell'utente finale */}
        <Route path="/player/:visitaId" element={<Player />} />
      </Routes>
    </BrowserRouter>
  );
}