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

io.on('connection', (socket) => {
  console.log(`Socket connesso: ${socket.id}`)

  // --- EVENTI DOCENTE ---
  socket.on('docente:crea', ({ visitaId }) => {
    const codice = generaCodice()
    
    sessioni.set(codice, {
      visitaId,
      indiceCorrente: 0,
      fase: 'visita',
      studenti: new Map() // Map interna per gli studenti connessi a questa stanza
    })

    socket.join(codice) // Il docente entra nella stanza Socket.io
    socket.emit('sessione:creata', { codice })
    console.log(`Sessione creata: ${codice} per visita ${visitaId}`)
  })

  socket.on('docente:vaiA', ({ codice, indice }) => {
    const sessione = sessioni.get(codice)
    if (sessione) {
      sessione.indiceCorrente = indice
      io.to(codice).emit('stato:opera', { indice }) // Broadcast solo alla stanza
    }
  })

  socket.on('docente:avviaQuiz', ({ codice, domande }) => {
    const sessione = sessioni.get(codice)
    if (sessione) {
      sessione.fase = 'quiz'
      io.to(codice).emit('quiz:inizio')
    }
  })

  socket.on('docente:chiudi', ({ codice }) => {
    io.to(codice).emit('sessione:fine')
    sessioni.delete(codice)
  })

  // --- EVENTI STUDENTE ---
  socket.on('studente:entra', ({ codice, nome }) => {
    const sessione = sessioni.get(codice)
    if (sessione) {
      socket.join(codice)
      
      // Aggiunge lo studente alla Map della sessione
      sessione.studenti.set(socket.id, { nome, livello: 'base', durata: 'corta', risposte: [] })

      // Manda lo stato attuale dell'opera allo studente appena entrato
      socket.emit('stato:opera', { indice: sessione.indiceCorrente })
      
      // Notifica il docente della lista studenti aggiornata
      const listaStudenti = Array.from(sessione.studenti.values())
      io.to(codice).emit('sessione:studenti', listaStudenti)
    }
  })

  socket.on('studente:cambiaLivello', ({ codice, livello, durata }) => {
    const sessione = sessioni.get(codice)
    if (sessione && sessione.studenti.has(socket.id)) {
      const studente = sessione.studenti.get(socket.id)
      studente.livello = livello
      studente.durata = durata
      
      const listaStudenti = Array.from(sessione.studenti.values())
      io.to(codice).emit('sessione:studenti', listaStudenti)
    }
  })

  // --- DISCONNESSIONE ---
  socket.on('disconnect', () => {
    console.log(`Socket disconnesso: ${socket.id}`)
    // Rimuove lo studente dalle sessioni se cade la connessione e aggiorna il docente
    sessioni.forEach((sessione, codice) => {
      if (sessione.studenti.has(socket.id)) {
        sessione.studenti.delete(socket.id)
        const listaStudenti = Array.from(sessione.studenti.values())
        io.to(codice).emit('sessione:studenti', listaStudenti)
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