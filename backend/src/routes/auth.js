const express = require('express')
const router = express.Router()
const Utente = require('../models/Utente')
const bcrypt = require('bcrypt')

router.post('/register', async (req, res) => {
  try {
    const { username, password, ruolo } = req.body
    const utente = new Utente({ username, password, ruolo })
    await utente.save() //metodo mondgoose per salvare in MongoDB
    res.status(201).json({ messaggio: 'Utente creato', username })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const utente = await Utente.findOne({ username })
    if (!utente) return res.status(401).json({ message: 'Credenziali errate' })
    const valida = await bcrypt.compare(password, utente.password)
    if (!valida) return res.status(401).json({ message: 'Credenziali errate' })
    res.json({ messaggio: 'Login ok', userId: utente._id, username, ruolo: utente.ruolo })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router