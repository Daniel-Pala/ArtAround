const express = require('express')
const router = express.Router()
const Item = require('../models/Item')
const Visita = require('../models/Visita')
const { richiediAutore } = require('../middleware/autorizzazione')

router.get('/', async (req, res) => {
  try {
    //cerca in url se è presente un museoId, se sì filtra gli item per quel museo, altrimenti ritorna tutti gli item
    //es . /api/items?museoId=1234
    const { museoId, livello } = req.query;
    const filtro = {};

    if (museoId) filtro.museoId = museoId;
    if (livello) filtro['testi.livello'] = livello;
    // items viene arricchito dal nome dell'autore e dal nome del museo, grazie a populate
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

router.put('/:id', richiediAutore, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Item non trovato' })
    if (String(item.autoreId) !== req.user.userId) {
      return res.status(403).json({ message: 'Non sei il proprietario di questa risorsa' })
    }
    const itemAggiornato = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(itemAggiornato)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', richiediAutore, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Item non trovato' })
    if (String(item.autoreId) !== req.user.userId) {
      return res.status(403).json({ message: 'Non sei il proprietario di questa risorsa' })
    }
    await Item.findByIdAndDelete(req.params.id)
    // lo tolgo anche dai percorsi che lo contenevano, altrimenti la populate
    // restituirebbe null al posto dell'item e il carrello si romperebbe
    await Visita.updateMany({}, { $pull: { items: { itemId: req.params.id } } })
    res.json({ messaggio: 'Item eliminato' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
