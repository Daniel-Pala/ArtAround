const express = require('express')
const router = express.Router()
const Museo = require('../models/Museo')

router.get('/', async (req, res) => {
  try {
    const musei = await Museo.find() //ritorna tuttti i musei presenti in MongoDB
    res.json(musei)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const museo = new Museo(req.body)
    await museo.save()
    res.status(201).json(museo)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router