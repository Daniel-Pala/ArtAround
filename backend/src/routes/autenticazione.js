const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utente = require('../models/Utente');

// REGISTRAZIONE NUOVO UTENTE
router.post('/register', async (req, res) => {
  try {
    const { username, password, ruolo } = req.body;
    const cleanUsername = username.trim();

    const utenteEsistente = await Utente.findOne({ username: cleanUsername });
    if (utenteEsistente) {
      return res.status(400).json({ message: 'Username già in uso. Scegline un altro.' });
    }

    const nuovoUtente = new Utente({
      username: cleanUsername,
      password: password,
      ruolo: ruolo
    });

    await nuovoUtente.save();
    res.status(201).json({ message: 'Utente creato con successo' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// LOGIN UTENTE
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = username.trim();

    const utente = await Utente.findOne({ username: cleanUsername });
    if (!utente) {
      return res.status(401).json({ message: 'Credenziali errate' });
    }

    const passwordValida = await bcrypt.compare(password, utente.password);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Credenziali errate' });
    }

    const token = jwt.sign(
      { userId: utente._id, ruolo: utente.ruolo, username: utente.username },
      process.env.JWT_SECRET
    );

    res.json({
      userId: utente._id,
      username: utente.username,
      ruolo: utente.ruolo,
      token: token
    });
  } catch (err) {
    res.status(500).json({ message: 'Errore del server durante il login' });
  }
});

module.exports = router;