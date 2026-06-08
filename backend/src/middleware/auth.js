const jwt = require('jsonwebtoken')

// Verifica il token JWT nell'header Authorization: Bearer <token>.
// Se valido, popola req.user con { userId, ruolo }.
function richiediAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token mancante' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { userId: payload.userId, ruolo: payload.ruolo }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token non valido o scaduto' })
  }
}

// Richiede che l'utente sia autenticato e abbia ruolo 'autore'.
// Da usare per le route POST.
function richiediAutore(req, res, next) {
  richiediAuth(req, res, () => {
    if (req.user.ruolo !== 'autore') {
      return res.status(403).json({ message: 'Solo gli autori possono eseguire questa azione' })
    }
    next()
  })
}

module.exports = { richiediAuth, richiediAutore }
