const jwt = require('jsonwebtoken');

// Middleware per QUALSIASI utente loggato (sia Visitatore che Autore)
const richiediAutenticazione = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('Header mancante');
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Popola req.user con { userId, ruolo, username }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Autenticazione fallita o token scaduto' });
  }
};

// Middleware SOLO per chi ha ruolo 'autore'
const richiediAutore = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('Header mancante');

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.ruolo !== 'autore') {
      return res.status(403).json({ message: 'Accesso negato: richiesto ruolo autore' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Autenticazione fallita o token scaduto' });
  }
};

module.exports = { richiediAutenticazione, richiediAutore };