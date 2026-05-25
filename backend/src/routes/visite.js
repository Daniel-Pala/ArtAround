const express = require('express')
const router = express.Router()
const Visita = require('../models/Visita')
const { richiediAutore, richiediProprietario } = require('../middleware/auth')

router.get('/', async (req, res) => {
  try {
    const { museoId } = req.query
    const filtro = {}
    if (museoId) filtro.museoId = museoId
    const visite = await Visita.find(filtro)
      .populate('autoreId', 'username')
      .populate('museoId', 'nome')
    res.json(visite)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id)
      .populate('autoreId', 'username')
      .populate('museoId', 'nome')
      .populate('items.itemId')
    if (!visita) return res.status(404).json({ message: 'Visita non trovata' })
    res.json(visita)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', richiediAutore, async (req, res) => {
  try {
    // autoreId viene SEMPRE dal token
    const visita = new Visita({ ...req.body, autoreId: req.user.userId })
    await visita.save()
    res.status(201).json(visita)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', richiediProprietario(id => Visita.findById(id)), async (req, res) => {
  try {
    const { autoreId, ...aggiornamento } = req.body
    const visita = await Visita.findByIdAndUpdate(req.params.id, aggiornamento, { new: true })
    res.json(visita)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', richiediProprietario(id => Visita.findById(id)), async (req, res) => {
  try {
    await Visita.findByIdAndDelete(req.params.id)
    res.json({ messaggio: 'Visita eliminata' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
