const express = require('express')
const router = express.Router()
const Utente = require('../models/Utente')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Genera un JWT firmato con userId e ruolo. Scadenza 7 giorni.
function generaToken(utente) {
  return jwt.sign(
    { userId: utente._id, ruolo: utente.ruolo },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

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
    const token = generaToken(utente)
    res.json({
      messaggio: 'Login ok',
      userId: utente._id,
      username,
      ruolo: utente.ruolo,
      token
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
