const express = require('express')
const router = express.Router()
const Visita = require('../models/Visita')

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

router.post('/', async (req, res) => {
  try {
    const visita = new Visita(req.body)
    await visita.save()
    res.status(201).json(visita)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const visita = await Visita.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!visita) return res.status(404).json({ message: 'Visita non trovata' })
    res.json(visita)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await Visita.findByIdAndDelete(req.params.id)
    res.json({ messaggio: 'Visita eliminata' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router