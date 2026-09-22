const express = require('express')
const router = express.Router()
const { popola } = require('../../seed')

// Sul server del dipartimento il database è un container che si raggiunge solo da dentro il
// cluster: da un nodo del laboratorio il nome mongo_site252634 non esiste, quindi il seed non
// si può lanciare a mano come in locale. Lo lancia allora il server stesso, che nel cluster
// ci sta già, quando riceve questa richiesta.
// Questa rotta cancella tutto il database, per cui esiste solo dove nel .env c'è SEED_TOKEN,
// e vuole quel valore nell'header. Senza, risponde 404 come qualunque rotta che non c'è:
// chi non sa che esiste non lo scopre provando.
router.post('/seed', async (req, res) => {
  if (!process.env.SEED_TOKEN || req.headers['x-seed-token'] !== process.env.SEED_TOKEN) {
    return res.status(404).json({ message: 'Endpoint API non trovato' })
  }
  try {
    await popola()
    res.json({ messaggio: 'Seed completato' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
