const express = require('express');
const router = express.Router();
const Visita = require('../models/Visita');
const Utente = require('../models/Utente');
const { richiediAutore, richiediAutenticazione } = require('../middleware/autorizzazione');

// Ottiene tutte le visite (filtrabili per museo e per stato di pubblicazione).
// La vetrina del visitatore passa ?pubblica=true; l'autore chiama senza filtro
// perche' nel suo museo deve continuare a vedere le proprie bozze.
router.get('/', async (req, res) => {
  try {
    const { museoId, pubblica } = req.query;
    const filtro = {};
    if (museoId) filtro.museoId = museoId;
    if (pubblica === 'true') filtro.pubblica = true;
    const visite = await Visita.find(filtro)
      .populate('autoreId', 'username')
      .populate('museoId', 'nome');
    res.json(visite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottiene solo le visite acquistate dall'utente loggato
router.get('/mie-visite', richiediAutenticazione, async (req, res) => {
  try {
    const utente = await Utente.findById(req.user.userId);
    if (!utente) return res.status(404).json({ message: 'Utente non trovato' });

    await utente.populate({
      path: 'acquisti',
      populate: { path: 'museoId', select: 'nome' }
    });

    res.json(utente.acquisti);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottiene i dettagli di una singola visita
router.get('/:id', async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id)
      .populate('autoreId', 'username')
      .populate('museoId', 'nome configFile')
      .populate('items.itemId');
    if (!visita) return res.status(404).json({ message: 'Visita non trovata' });
    res.json(visita);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sblocca una visita per l'utente loggato (checkout finto, nessun pagamento)
router.post('/:id/acquista', richiediAutenticazione, async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id);
    if (!visita) return res.status(404).json({ message: 'Visita non trovata' });

    const utente = await Utente.findById(req.user.userId);
    if (!utente) return res.status(404).json({ message: 'Utente non trovato' });

    // gli ObjectId non si confrontano con ===, servono le stringhe
    const haGiaAcquistato = utente.acquisti.some(id => id.toString() === visita._id.toString());

    if (haGiaAcquistato) {
      return res.status(400).json({ message: 'Hai già sbloccato questo percorso' });
    }

    utente.acquisti.push(visita._id);
    await utente.save();

    res.json({ message: 'Percorso sbloccato con successo!', acquisti: utente.acquisti });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crea una nuova visita (Solo Autori)
router.post('/', richiediAutore, async (req, res) => {
  try {
    //autoreID viene dal token JWT, quindi non può essere manipolato dall'utente
    const visita = new Visita({ ...req.body, autoreId: req.user.userId });
    await visita.save();
    res.status(201).json(visita);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Aggiorna una visita (Solo Autori proprietari)
router.put('/:id', richiediAutore, async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id);
    if (!visita) return res.status(404).json({ message: 'Visita non trovata' });
    if (String(visita.autoreId) !== req.user.userId) {
      return res.status(403).json({ message: 'Non sei il proprietario di questa risorsa' });
    }
    const visitaAggiornata = await Visita.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(visitaAggiornata);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Elimina una visita (Solo Autori proprietari)
router.delete('/:id', richiediAutore, async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id);
    if (!visita) return res.status(404).json({ message: 'Visita non trovata' });
    if (String(visita.autoreId) !== req.user.userId) {
      return res.status(403).json({ message: 'Non sei il proprietario di questa risorsa' });
    }
    await Visita.findByIdAndDelete(req.params.id);
    res.json({ messaggio: 'Visita eliminata' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;