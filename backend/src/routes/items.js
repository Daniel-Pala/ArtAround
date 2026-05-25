const express = require('express')
const router = express.Router()
const Item = require('../models/Item')
const { richiediAutore, richiediProprietario } = require('../middleware/auth')

router.get('/', async (req, res) => {
  try {
    //cerca in url se è presente un museoId, se sì filtra gli item per quel museo, altrimenti ritorna tutti gli item
    //es . /api/items?museoId=1234
    const { museoId, livello } = req.query;
    const filtro = {};

    if (museoId) filtro.museoId = museoId;
    if (livello) filtro['testi.livello'] = livello;
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

router.post('/', richiediAutore, async (req, res) => {
  try {
    // autoreId viene SEMPRE dal token, mai dal body, così nessuno può fingersi un altro autore
    const item = new Item({ ...req.body, autoreId: req.user.userId })
    await item.save()
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', richiediProprietario(id => Item.findById(id)), async (req, res) => {
  try {
    // non lasciamo cambiare autoreId via body
    const { autoreId, ...aggiornamento } = req.body
    const item = await Item.findByIdAndUpdate(req.params.id, aggiornamento, { new: true })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', richiediProprietario(id => Item.findById(id)), async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id)
    res.json({ messaggio: 'Item eliminato' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
