const express = require('express')
const router = express.Router()
const Item = require('../models/Item')
const Visita = require('../models/Visita')
const QRCode = require('qrcode')
const { richiediAutore, richiediAutenticazione } = require('../middleware/autorizzazione')

// I testi sono la merce del negozio: di un item che non è nostro escono durata, livello,
// lingua e provenienza — quello che serve all'elenco del curatore per dire cosa è già
// stato scritto su un'opera e a che prezzo — ma non il testo, che si legge comprando la
// visita che lo contiene. Stessa regola del dettaglio di una visita.
// Elenco i campi che escono invece di cancellare quelli che non devono uscire: se domani
// un testo si porta dietro un campo nuovo, quello non parte da solo.
function senzaTestoAltrui(item, userId) {
  // qui autoreId non è più un id: la populate l'ha già sostituito con { _id, username }.
  // Il ?. serve solo a non far crollare la rotta se l'utente autore è stato cancellato.
  const suo = String(item.autoreId?._id) === userId
  if (suo) return item
  return {
    ...item,
    testi: item.testi.map(t => ({
      durata: t.durata,
      livello: t.livello,
      lingua: t.lingua,
      generatoDa: t.generatoDa
    }))
  }
}

router.get('/', richiediAutenticazione, async (req, res) => {
  try {
    //cerca in url se è presente un museoId, se sì filtra gli item per quel museo, altrimenti ritorna tutti gli item
    //es . /api/items?museoId=1234
    const { museoId, livello, operaId } = req.query;
    const filtro = {};

    if (museoId) filtro.museoId = museoId;
    if (livello) filtro['testi.livello'] = livello;
    // operaId è il codice Wikidata: è quello che sta dentro il QR code
    // appeso di fianco all'opera, quindi da una scansione si arriva agli item.
    if (operaId) filtro.operaId = operaId;
    // items viene arricchito dal nome dell'autore e dal nome del museo, grazie a populate.
    // lean() perché i documenti qui li devo modificare prima di mandarli: senza, mongoose
    // torna oggetti suoi, con dentro i metodi, e lo spread di senzaTestoAltrui li perderebbe
    const items = await Item.find(filtro).populate('autoreId', 'username').populate('museoId', 'nome').lean()
    res.json(items.map(item => senzaTestoAltrui(item, req.user.userId)))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PNG del QR code di un'opera, da appendere di fianco al quadro.
// Dentro al QR ci sta solo il codice Wikidata: un QR non è un identificatore
// registrato da qualche parte, è solo un modo di disegnare una stringa, quindi
// ci mettiamo quella che usiamo già come chiave delle opere.
// La pagina di stampa (marketplace/qr.html) lo mostra con un semplice <img src>, ed è
// anche il motivo per cui questa resta l'unica rotta degli item senza token: un <img>
// non manda header. Del resto il codice Wikidata è già stampato sul cartellino al muro.
// Va dichiarata prima di GET /:id per non farsi leggere "qr" come un id.
router.get('/qr/:operaId', async (req, res) => {
  const png = await QRCode.toBuffer(req.params.operaId, { width: 400, margin: 1 })
  res.type('png').send(png)
})

//ritorna un item specifico per id, con i dati dell'autore e del museo
router.get('/:id', richiediAutenticazione, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('autoreId', 'username').populate('museoId', 'nome').lean()
    if (!item) return res.status(404).json({ message: 'Item non trovato' })
    res.json(senzaTestoAltrui(item, req.user.userId))
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
