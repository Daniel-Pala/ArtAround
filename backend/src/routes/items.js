const express = require('express')
const router = express.Router()
const Item = require('../models/Item')

router.get('/', async (req, res) => {
  try {
    //cerca in url se è presente un museoId, se sì filtra gli item per quel museo, altrimenti ritorna tutti gli item
    //es . /api/items?museoId=1234
    const { museoId, livello } = req.query 
    //oggetto filtro per non avere museoId undefined
    const filtro = {}
    if (museoId) filtro.museoId = museoId
    if (livello) filtro['testi.livello'] = livello
    // items è composto dal nome dell'autore e dal nome del museo, grazie a populate
    const items = await Item.find(filtro).populate('autoreId', 'username').populate('museoId', 'nome')
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

//ritorna un item specifico per id, con i dati dell'autore e del museo
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('autoreId', 'username').populate('museoId', 'nome')
    if (!item) return res.status(404).json({ message: 'Item non trovato' })
    res.json(item)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const item = new Item(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ message: 'Item non trovato' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id)
    res.json({ messaggio: 'Item eliminato' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router