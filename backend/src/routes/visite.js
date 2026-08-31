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
    // i percorsi su misura non stanno in nessuna delle due liste: non sono in vendita e non
    // sono del museo, li vede solo chi se li e' fatti fare, da mie-visite
    const filtro = { suMisura: { $ne: true } };
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

// Le visite che l'utente puo' avviare nel Navigator: quelle acquistate piu',
// se e' un autore, quelle scritte da lui (i propri percorsi non si comprano).
router.get('/mie-visite', richiediAutenticazione, async (req, res) => {
  try {
    // Il token non scade mai e il seed ricrea gli utenti da zero: un token di un
    // seed precedente ha la firma valida ma indica un utente che non esiste piu'.
    // E' una credenziale non valida, non una richiesta su una risorsa mancante:
    // col 401 il client svuota la sessione e rimanda al login da solo.
    const utente = await Utente.findById(req.user.userId);
    if (!utente) return res.status(401).json({ message: 'Sessione non piu\' valida' });

    await utente.populate({
      path: 'acquisti',
      populate: { path: 'museoId', select: 'nome' }
    });

    const proprie = await Visita.find({ autoreId: req.user.userId }).populate('museoId', 'nome');
    // chi ha comprato una visita e poi l'ha ereditata come autore la vedrebbe due volte
    const acquistate = utente.acquisti.filter(v => String(v.autoreId) !== req.user.userId);

    res.json([...proprie, ...acquistate]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Il dettaglio di una visita lo chiedono in due: il negozio, che mostra l'elenco
// delle tappe prima dell'acquisto, e il Player, che invece ha bisogno dei testi.
// Chi non l'ha comprata (e non e' l'autore) riceve solo i titoli delle tappe.
router.get('/:id', richiediAutenticazione, async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id)
      .populate('autoreId', 'username')
      .populate('museoId', 'nome configFile');
    if (!visita) return res.status(404).json({ message: 'Visita non trovata' });

    const acquistata = await Utente.exists({ _id: req.user.userId, acquisti: visita._id });
    const sua = String(visita.autoreId?._id) === req.user.userId;

    await visita.populate({ path: 'items.itemId', select: acquistata || sua ? undefined : 'titolo' });
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