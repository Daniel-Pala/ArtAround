const express = require('express');
const router = express.Router();
const Utente = require('../models/Utente');

// Rotta per ottenere i dati dell'utente (per vedere le visite acquistate)
router.get('/:id', async (req, res) => {
    try {
        const utente = await Utente.findById(req.params.id);
        if (!utente) return res.status(404).json({ message: "Utente non trovato" });
        res.json(utente);
    } catch (error) {
        res.status(500).json({ error: "Errore nel recupero dati utente" });
    }
});

// Rotta per l'acquisto (aggiunge la visita all'array dell'utente)
router.post('/acquista', async (req, res) => {
    const { userId, visitaId } = req.body;

    try {
        // $push aggiunge l'id della visita all'array visiteAcquistate
        const utenteAggiornato = await Utente.findByIdAndUpdate(
            userId,
            { $push: { visiteAcquistate: visitaId } },
            { new: true }
        );

        if (!utenteAggiornato) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        res.status(200).json({ message: "Acquisto effettuato con successo", utente: utenteAggiornato });
    } catch (error) {
        res.status(500).json({ error: "Errore interno del server durante l'acquisto" });
    }
});

module.exports = router;