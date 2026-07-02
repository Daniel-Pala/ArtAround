const jwt = require('jsonwebtoken')

// Verifica il token JWT nell'header Authorization: Bearer <token>.
// Se valido, popola req.user con il payload { userId, ruolo, username }.
const richiediAutenticazione = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) throw new Error('Header mancante')
    const token = authHeader.split(' ')[1]
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Autenticazione fallita o token scaduto' })
  }
}

// Richiede autenticazione + ruolo 'autore'. Riusa richiediAutenticazione.
const richiediAutore = (req, res, next) => {
  richiediAutenticazione(req, res, () => {
    if (req.user.ruolo !== 'autore') {
      return res.status(403).json({ message: 'Accesso negato: richiesto ruolo autore' })
    }
    next()
  })
}

module.exports = { richiediAutenticazione, richiediAutore }
