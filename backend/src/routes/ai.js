const express = require('express')
const router = express.Router()
const Item = require('../models/Item')
const Visita = require('../models/Visita')
const Utente = require('../models/Utente')
const { chiedi } = require('../ai')
const { richiediAutenticazione } = require('../middleware/autorizzazione')

// Quanto deve venire lungo il testo: ad alta voce si leggono circa due parole e mezzo al
// secondo. Accanto al numero di parole ci va la forma, perche' col solo numero il modello
// tira via e da un testo da quattro minuti tira fuori un riassunto invece di una frase.
const lunghezze = {
  '3s': { parole: 8, forma: 'una frase sola e corta' },
  '15s': { parole: 40, forma: 'due o tre frasi' },
  '1min': { parole: 150, forma: 'un paragrafo' },
  '4min': { parole: 600, forma: 'quattro o cinque paragrafi' },
}

// Le lingue in cui sappiamo scrivere: il nome per esteso finisce dentro al prompt.
const lingue = { it: 'italiano', en: 'inglese', fr: 'francese', es: 'spagnolo', de: 'tedesco' }

// Quanto tempo ha il visitatore e con chi e'. Sono tendine, non caselle di testo: il
// prompt lo compone il backend, l'utente sceglie e basta.
const tempi = { '30': 'mezz\'ora', '60': "un'ora", '120': 'due ore' }
const compagnie = {
  solo: 'una persona sola',
  coppia: 'due adulti',
  bambini: 'una famiglia con bambini delle elementari',
  gruppo: 'un gruppo di amici adulti'
}

// A chi si rivolge il testo, un livello per riga
const destinatari = {
  infantile: 'un bambino di cinque anni, con frasi corte e parole di tutti i giorni',
  elementare: 'un bambino delle elementari, senza termini tecnici',
  medio: 'un adulto curioso che non ha studiato storia dell\'arte',
  specialistico: 'uno studente di storia dell\'arte, con il lessico della disciplina'
}

// Scrive la combinazione di livello, durata e lingua che manca e la salva dentro l'item,
// cosi' la volta dopo c'e' gia' e non si dipende dall'API viva.
// La chiamano in due: il Player, da solo, quando il visitatore sceglie una combinazione che
// nessuno ha ancora scritto (per lui non c'e' nessun bottone e nessuna casella di testo, il
// testo compare e basta), e il marketplace, dove invece e' il curatore a chiederla per
// un'opera che ha appena messo in catalogo.
router.post('/testo', richiediAutenticazione, async (req, res) => {
  try {
    const { itemId, livello, durata } = req.body
    const lingua = req.body.lingua || 'it'
    // i valori arrivano dal client e finiscono in un prompt: passano solo quelli
    // che il model conosce gia'
    if (!lunghezze[durata] || !destinatari[livello] || !lingue[lingua]) {
      return res.status(400).json({ message: 'Livello, durata o lingua non previsti' })
    }

    const item = await Item.findById(itemId)
    if (!item) return res.status(404).json({ message: 'Item non trovato' })

    // stessi permessi del dettaglio della visita: i testi sono contenuto a pagamento,
    // e senza questo controllo basterebbe un id per farseli scrivere tutti
    const utente = await Utente.findById(req.user.userId)
    if (!utente) return res.status(401).json({ message: 'Sessione non piu\' valida' })
    const suo = String(item.autoreId) === req.user.userId
    const acquistato = await Visita.exists({ 'items.itemId': item._id, _id: { $in: utente.acquisti } })
    if (!suo && !acquistato) {
      return res.status(403).json({ message: 'Questo contenuto non e\' tuo' })
    }

    // se la combinazione nel frattempo c'e' gia' ci fermiamo qui: rigenerarla
    // costerebbe una chiamata e lascerebbe due testi gemelli nello stesso item
    if (item.testi.some(t => t.livello === livello && t.durata === durata && (t.lingua || 'it') === lingua)) {
      return res.json(item)
    }

    // Il materiale di partenza e' sempre quello che ha scritto il curatore, cosi' la LLM
    // riscrive e non inventa: non puo' attribuire all'opera fatti che nessuno le ha dato.
    // Per una lingua straniera parto dal testo italiano dello stesso livello e durata, se
    // c'e', perche' allora e' una traduzione e basta; altrimenti dal piu' lungo che ho.
    const italiani = item.testi.filter(t => (t.lingua || 'it') === 'it')
    const fonte = italiani.find(t => t.livello === livello && t.durata === durata)
      || [...italiani].sort((a, b) => b.testo.length - a.testo.length)[0]

    // La lunghezza gliela chiediamo in parole dentro al prompt e non come tetto sui
    // token: il tetto e' un taglio netto, e un testo troncato a meta' frase finirebbe
    // salvato cosi' com'e'.
    const testo = await chiedi([
      {
        role: 'system',
        content: `Sei il curatore di un museo e scrivi le audioguide. Riscrivi il materiale che ti viene dato senza aggiungere fatti che non ci sono, e taglia quello che non ci sta: la lunghezza richiesta e' un vincolo, non un consiglio, anche quando il materiale di partenza e' molto piu' lungo. Rispondi in ${lingue[lingua]} con il solo testo da ascoltare: niente titolo, niente elenchi, niente asterischi e nessuna virgoletta attorno al testo, dato che quello che scrivi lo legge ad alta voce una voce sintetica. Gli apostrofi dentro le parole servono e vanno scritti.`
      },
      {
        role: 'user',
        content: [
          `Opera: ${item.titolo}`,
          item.autoreOpera && `Autore: ${item.autoreOpera}`,
          item.stile && `Stile: ${item.stile}`,
          item.descrizione && `Didascalia: ${item.descrizione}`,
          fonte && `Testo gia' scritto: ${fonte.testo}`,
          `Scrivi la descrizione in ${lingue[lingua]} per ${destinatari[livello]}.`,
          `Lunghezza: ${lunghezze[durata].forma}, circa ${lunghezze[durata].parole} parole, e non di piu'.`
        ].filter(Boolean).join('\n')
      }
    ])

    item.testi.push({ livello, durata, lingua, testo, generatoDa: process.env.AI_MODEL })
    await item.save()
    // torna l'item intero: al Player serve rileggerlo per trovarci dentro il testo nuovo
    res.json(item)
  } catch (err) {
    // qui l'unica cosa che va storta davvero e' la chiamata alla LLM, e il suo
    // messaggio e' quello da leggere
    res.status(502).json({ message: err.message })
  }
})

// Il secondo mestiere della LLM: capire i comandi detti a parole proprie.
// Il vocabolario fisso del Player copre le frasi previste ("prossimo", "avanti"); quando
// non riconosce niente arriva qui la frase intera insieme all'elenco dei comandi
// disponibili in quel momento. La LLM non risponde alla domanda del visitatore: sceglie
// una voce da un elenco chiuso, e se quello che risponde non e' in elenco lo buttiamo.
router.post('/comando', richiediAutenticazione, async (req, res) => {
  try {
    const { frase, comandi } = req.body
    if (!frase || !comandi?.length) {
      return res.status(400).json({ message: 'Servono la frase e l\'elenco dei comandi' })
    }

    const risposta = await chiedi([
      {
        role: 'system',
        content: 'Sei il selettore dei comandi di un\'audioguida da museo. Ti do l\'elenco dei comandi disponibili e una frase detta dal visitatore. Rispondi con il nome di un comando dell\'elenco, copiato esatto, oppure con NESSUNO se la frase non corrisponde a nessuno di quei comandi. Non scrivere nient\'altro.'
      },
      {
        role: 'user',
        content: `Comandi disponibili:\n${comandi.join('\n')}\n\nFrase del visitatore: "${frase}"`
      }
    ])

    const scelto = comandi.find(c => c.toLowerCase() === risposta.toLowerCase())
    res.json({ comando: scelto || null })
  } catch (err) {
    res.status(502).json({ message: err.message })
  }
})

// Le opere fra cui si puo' comporre un percorso su misura: quelle delle visite che l'utente
// ha comprato o scritto, cioe' quelle che gia' puo' leggere. E' questo filtro a impedire che
// il percorso su misura diventi il modo di farsi dare gratis i contenuti di tutto il museo.
// Torna anche le indicazioni logistiche, che ogni tappa si porta dietro dalla visita da cui
// viene, e il museo: mappa e logistica valgono per un museo solo, quindi un percorso che ne
// mescolasse due non si potrebbe nemmeno seguire.
async function opereDisponibili(utente) {
  const sue = await Visita.find({ $or: [{ autoreId: utente._id }, { _id: { $in: utente.acquisti } }] })
    .populate('items.itemId')
  if (sue.length === 0) return null

  const museoId = String(sue[0].museoId)
  const candidati = new Map()
  const indicazioni = new Map()
  for (const visita of sue.filter(v => String(v.museoId) === museoId)) {
    for (const tappa of visita.items) {
      if (!tappa.itemId) continue
      candidati.set(String(tappa.itemId._id), tappa.itemId)
      if (tappa.indicazioneLogistica) indicazioni.set(String(tappa.itemId._id), tappa.indicazioneLogistica)
    }
  }
  return { museoId, candidati, indicazioni, infoLogistiche: sue[0].infoLogistiche }
}

// Gli stili delle opere qui sopra: sono le caselle "cosa ti interessa" del form, quindi
// l'elenco esce dai dati veri del museo e non da una lista scritta a mano.
router.get('/interessi', richiediAutenticazione, async (req, res) => {
  try {
    const utente = await Utente.findById(req.user.userId)
    if (!utente) return res.status(401).json({ message: 'Sessione non piu\' valida' })
    const disponibili = await opereDisponibili(utente)
    const stili = [...(disponibili?.candidati.values() || [])].map(i => i.stile).filter(Boolean)
    res.json([...new Set(stili)])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Il quarto mestiere della LLM: comporre una visita su misura.
// Non inventa niente: riceve l'elenco delle tappe fra cui puo' scegliere e risponde con
// i loro id. Quell'elenco lo costruiamo qui dalle visite che l'utente ha gia' comprato o
// scritto, e non da quello che manda il client: e' quel filtro a impedire che una visita
// su misura diventi il modo di leggere gratis i contenuti di tutto il museo.
router.post('/visita', richiediAutenticazione, async (req, res) => {
  try {
    const { minuti, compagnia, interessi } = req.body
    if (!tempi[minuti] || !compagnie[compagnia]) {
      return res.status(400).json({ message: 'Tempo o compagnia non previsti' })
    }

    const utente = await Utente.findById(req.user.userId)
    if (!utente) return res.status(401).json({ message: 'Sessione non piu\' valida' })

    const disponibili = await opereDisponibili(utente)
    if (!disponibili) {
      return res.status(400).json({ message: 'Non hai ancora nessuna visita da cui partire' })
    }
    const { museoId, candidati, indicazioni, infoLogistiche } = disponibili

    // anche gli interessi finiscono nel prompt: tengo solo gli stili che il museo ha davvero
    const stili = new Set([...candidati.values()].map(i => i.stile).filter(Boolean))
    const temi = (interessi || []).filter(s => stili.has(s))

    const elenco = [...candidati.values()]
      .map(i => `${i._id} | ${i.titolo} | ${i.autoreOpera || 'autore ignoto'} | ${i.stile || 'stile non indicato'}`)
      .join('\n')

    const risposta = await chiedi([
      {
        role: 'system',
        content: 'Sei chi accoglie i visitatori di un museo e prepara i percorsi. Ti do le opere fra cui puoi scegliere, una per riga, nel formato id | titolo | autore | stile. Scegli quali far vedere e in che ordine. Rispondi con il solo JSON {"nome": "...", "items": ["id", "id"]}: nessun commento, nessun blocco di codice. Gli id devono essere copiati esatti dall\'elenco, il nome e\' un titolo breve in italiano per il percorso.'
      },
      {
        role: 'user',
        content: [
          `Opere disponibili:\n${elenco}`,
          '',
          `Il visitatore ha ${tempi[minuti]} e sta visitando come ${compagnie[compagnia]}.`,
          temi.length ? `Gli interessa soprattutto: ${temi.join(', ')}.` : null,
          // il conto delle tappe lo facciamo noi: fra ascolto e spostamento sono circa tre
          // minuti a tappa, e lasciarlo fare alla LLM dava percorsi lunghi uguali per
          // mezz'ora e per due ore
          `Scegli ${Math.min(Math.round(Number(minuti) / 3), candidati.size)} tappe fra quelle disponibili.`
        ].filter(Boolean).join('\n')
      }
    ])

    // alcuni modelli incartano il JSON in un blocco di codice anche quando gli dici di no
    const scelta = JSON.parse(risposta.replace(/```json|```/g, '').trim())
    // gli id che non sono nell'elenco che gli abbiamo dato non esistono o non sono suoi
    const scelti = (scelta.items || []).filter(id => candidati.has(id))
    if (scelti.length < 2) {
      return res.status(502).json({ message: 'Non sono riuscito a comporre un percorso' })
    }

    const visita = await Visita.create({
      nome: scelta.nome || `Visita di ${tempi[minuti]}`,
      museoId,
      autoreId: utente._id,
      pubblica: false,
      prezzo: 0,
      infoLogistiche,
      // l'indicazione per arrivare a una tappa se la porta dietro dalla visita da cui viene
      items: scelti.map((id, posizione) => ({
        itemId: id,
        ordine: posizione + 1,
        opzionale: false,
        indicazioneLogistica: indicazioni.get(id)
      }))
    })

    res.status(201).json(visita)
  } catch (err) {
    res.status(502).json({ message: err.message })
  }
})

module.exports = router
