const express = require('express');
const router = express.Router();
const Visita = require('../models/Visita');
const Utente = require('../models/Utente');
const { richiediAutore, richiediAutenticazione } = require('../middleware/autorizzazione');

// Ottiene tutte le visite (filtrabili per museo)
router.get('/', async (req, res) => {
  try {
    const { museoId } = req.query;
    const filtro = {};
    if (museoId) filtro.museoId = museoId;
    const visite = await Visita.find(filtro)
      .populate('autoreId', 'username')
      .populate('museoId', 'nome');
    res.json(visite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NUOVA: Ottiene SOLO le visite acquistate dall'utente loggato
router.get('/mie-visite', richiediAutenticazione, async (req, res) => {
  try {
    const utente = await Utente.findById(req.user.userId);
    if (!utente) return res.status(404).json({ message: 'Utente non trovato' });

    // CONTROLLO DI SICUREZZA
    if (!utente.acquisti || utente.acquisti.length === 0) {
      return res.json([]);
    }

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

// NUOVA: Sblocca/Acquista una visita
router.post('/:id/acquista', richiediAutenticazione, async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id);
    if (!visita) return res.status(404).json({ message: 'Visita non trovata' });

    const utente = await Utente.findById(req.user.userId);
    if (!utente) return res.status(404).json({ message: 'Utente non trovato' });

    // Fallback di sicurezza se l'array è assente nei vecchi utenti
    if (!utente.acquisti) {
      utente.acquisti = [];
    }

    // Controllo a prova di bomba convertendo in stringa gli ObjectId
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