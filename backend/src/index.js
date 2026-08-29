const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const app = express()

// Creazione server HTTP e inizializzazione Socket.io
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
})

// Stato globale delle sessioni in RAM (KISS: niente database per i dati live)
// Struttura: sessioni = Map<codice, { visitaId, indiceCorrente, fase, studenti: Map }>
const sessioni = new Map()

// Funzione helper per generare un codice stanza univoco di 6 caratteri (es. X8K9A2)
const generaCodice = () => Math.random().toString(36).substring(2, 8).toUpperCase()

// --- AGGIUNTA PER ESTENSIONE 18-27 ---
// Normalizza le stringhe dei codici per evitare errori (es. "Fenice Rossa" -> "FENICEROSSA")
const normalizzaCodice = (str) => str ? str.trim().toUpperCase().replace(/\s+/g, '') : ''
// ------------------------------------

io.on('connection', (socket) => {
  console.log(`Socket connesso: ${socket.id}`)

  // --- EVENTI DOCENTE ---
  socket.on('docente:crea', ({ visitaId, codiceMnemonico }) => {
    // Se la docente fornisce un nome mnemonico, usiamo quello, altrimenti codice casuale
    const codiceRaw = codiceMnemonico || generaCodice()
    const codiceChiave = normalizzaCodice(codiceRaw)
    
    sessioni.set(codiceChiave, {
      visitaId,
      codiceOriginale: codiceRaw,
      indiceCorrente: 0,
      fase: 'visita',
      studenti: new Map() // Map interna per gli studenti connessi a questa stanza
    })

    socket.join(codiceChiave) // Il docente entra nella stanza Socket.io
    socket.emit('sessione:creata', { codice: codiceRaw })
    console.log(`Sessione creata: ${codiceRaw} (${codiceChiave}) per visita ${visitaId}`)
  })

  socket.on('docente:vaiA', ({ codice, indice }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione) {
      sessione.indiceCorrente = indice
      // Invia sia l'indice sia l'ID della visita alla stanza
      io.to(key).emit('stato:item', { indice, visitaId: sessione.visitaId })
    }
  })

  socket.on('docente:avviaQuiz', ({ codice, quiz }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione) {
      sessione.fase = 'quiz'
      io.to(key).emit('quiz:inizio', { quiz })
    }
  })

  socket.on('docente:chiudi', ({ codice }) => {
    const key = normalizzaCodice(codice)
    io.to(key).emit('sessione:fine')
    sessioni.delete(key)
  })

  // --- EVENTI STUDENTE ---
  socket.on('studente:entra', ({ codice, nome }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione) {
      socket.join(key)
      
      // Aggiunge lo studente alla Map della sessione (aggiunti voto e risposte per il quiz)
      sessione.studenti.set(socket.id, { socketId: socket.id, nome, livello: 'base', durata: 'corta', voto: null, risposte: [] })

      // Manda sia la visitaId sia lo stato attuale dell'item allo studente appena entrato
      socket.emit('stato:item', { indice: sessione.indiceCorrente, visitaId: sessione.visitaId })
      
      // Notifica il docente della lista studenti aggiornata
      const listaStudenti = Array.from(sessione.studenti.values())
      io.to(key).emit('sessione:studenti', listaStudenti)
    } else {
      socket.emit('errore', { messaggio: 'Codice sessione non trovato' })
    }
  })

  socket.on('studente:cambiaLivello', ({ codice, livello, durata }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione && sessione.studenti.has(socket.id)) {
      const studente = sessione.studenti.get(socket.id)
      studente.livello = livello
      studente.durata = durata
      
      const listaStudenti = Array.from(sessione.studenti.values())
      io.to(key).emit('sessione:studenti', listaStudenti)

      // --- AGGIUNTA PER ESTENSIONE 18-27 ---
      // Notifica in tempo reale per il pannello di monitoraggio del docente
      io.to(key).emit('docente:logAttivita', {
        messaggio: `${studente.nome} ha richiesto livello '${livello}' e durata '${durata}'`
      })
      // ------------------------------------
    }
  })

  // --- AGGIUNTA PER ESTENSIONE 18-27: QUIZ ---
  socket.on('studente:invioQuiz', ({ codice, risposte, totaleDomande, corrette }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione && sessione.studenti.has(socket.id)) {
      const studente = sessione.studenti.get(socket.id)
      
      // Calcolo del voto in decimi
      const voto = Math.round((corrette / totaleDomande) * 10)
      studente.voto = voto
      studente.risposte = risposte

      // Aggiorna la dashboard del docente con i risultati
      const listaStudenti = Array.from(sessione.studenti.values())
      io.to(key).emit('sessione:studenti', listaStudenti)
    }
  })
  // -----------------------------------------

  // --- DISCONNESSIONE ---
  socket.on('disconnect', () => {
    console.log(`Socket disconnesso: ${socket.id}`)
    sessioni.forEach((sessione, key) => {
      if (sessione.studenti.has(socket.id)) {
        sessione.studenti.delete(socket.id)
        const listaStudenti = Array.from(sessione.studenti.values())
        io.to(key).emit('sessione:studenti', listaStudenti)
      }
    })
  })
})

// --- MIDDLEWARE E ROTTE EXPRESS ---
app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/autenticazione'))
app.use('/api/musei', require('./routes/musei'))
app.use('/api/items', require('./routes/items'))
app.use('/api/visite', require('./routes/visite'))

app.get('/api-status', (req, res) => {
  res.json({ messaggio: 'ArtAround backend funziona' })
})

app.use(express.static(path.join(__dirname, '../../marketplace')))

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Endpoint API non trovato' })
  }
  res.sendFile(path.join(__dirname, '../../marketplace/index.html'))
})

// --- CONNESSIONE DATABASE E AVVIO SERVER ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connesso a MongoDB')
    server.listen(process.env.PORT, () => {
      console.log(`Server HTTP e Socket.io avviati sulla porta ${process.env.PORT}`)
    })
  })
  .catch(err => {
    console.error('Errore connessione MongoDB:', err)
    process.exit(1)
  })