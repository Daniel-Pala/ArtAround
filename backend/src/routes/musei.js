const express = require('express')
const router = express.Router()
const Museo = require('../models/Museo')
const { richiediAutore } = require('../middleware/autorizzazione')

router.get('/', async (req, res) => {
  try {
    //ritorna tuttti i musei presenti in MongoDB 
    const musei = await Museo.find() 
    res.json(musei)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', richiediAutore, async (req, res) => {
  try {
    const museo = new Museo(req.body)
    await museo.save()
    res.status(201).json(museo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const museo = await Museo.findById(req.params.id)
    if (!museo) return res.status(404).json({ message: 'Museo non trovato' })
    res.json(museo)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/:id', richiediAutore, async (req, res) => {
  try {
    const museo = await Museo.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!museo) return res.status(404).json({ message: 'Museo non trovato' })
    res.json(museo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', richiediAutore, async (req, res) => {
  try {
    await Museo.findByIdAndDelete(req.params.id)
    res.json({ messaggio: 'Museo eliminato' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
