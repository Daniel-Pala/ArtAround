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

// Verifica che l'utente loggato sia il proprietario della risorsa.
// Riceve una funzione async che dato l'id ritorna la risorsa (o null).
// Se la risorsa non esiste -> 404; se non è proprietario -> 403.
// Usabile come factory: richiediProprietario(id => Item.findById(id))
function richiediProprietario(trovaRisorsa) {
  return async (req, res, next) => {
    richiediAuth(req, res, async () => {
      try {
        const risorsa = await trovaRisorsa(req.params.id)
        if (!risorsa) return res.status(404).json({ message: 'Risorsa non trovata' })
        if (String(risorsa.autoreId) !== req.user.userId) {
          return res.status(403).json({ message: 'Non sei il proprietario di questa risorsa' })
        }
        req.risorsa = risorsa
        next()
      } catch (err) {
        res.status(500).json({ message: err.message })
      }
    })
  }
}

module.exports = { richiediAuth, richiediAutore, richiediProprietario }
