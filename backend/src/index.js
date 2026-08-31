const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const http = require('http')
const { Server } = require('socket.io')
// il .env sta nella cartella backend, non in quella da cui si lancia il comando
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const app = express()

// Creazione server HTTP e inizializzazione Socket.io
const server = http.createServer(app)
// Nessun CORS da dichiarare: in produzione le due applicazioni le serve questo stesso
// processo, e in sviluppo il server di Vite gira le richieste qui, quindi per il browser
// l'origine e' sempre una sola.
const io = new Server(server)

// Stato globale delle sessioni in RAM
const sessioni = new Map()

// Funzione helper per generare un codice stanza
const generaCodice = () => Math.random().toString(36).substring(2, 8).toUpperCase()
const normalizzaCodice = (str) => str ? str.trim().toUpperCase().replace(/\s+/g, '') : ''

io.on('connection', (socket) => {
  console.log(`Socket connesso: ${socket.id}`)

  // --- EVENTI DOCENTE ---
  socket.on('docente:crea', ({ visitaId, codiceMnemonico }) => {
    const codiceRaw = codiceMnemonico || generaCodice()
    const codiceChiave = normalizzaCodice(codiceRaw)
    
    sessioni.set(codiceChiave, {
      visitaId,
      codiceOriginale: codiceRaw,
      indiceCorrente: 0,
      fase: 'visita',
      quizDati: null, // Aggiunto per persistenza in caso di riconnessione
      studenti: new Map()
    })

    socket.join(codiceChiave)
    socket.emit('sessione:creata', { codice: codiceRaw })
  })

  socket.on('docente:vaiA', ({ codice, indice }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione) {
      sessione.indiceCorrente = indice
      io.to(key).emit('stato:item', { indice, visitaId: sessione.visitaId })
    }
  })

  // NUOVO: La docente forza la riproduzione dell'audio
  socket.on('docente:forzaAudio', ({ codice }) => {
    const key = normalizzaCodice(codice)
    if (sessioni.has(key)) {
      io.to(key).emit('studente:playAudio')
    }
  })

  socket.on('docente:avviaQuiz', ({ codice, domande }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione) {
      sessione.fase = 'quiz'
      sessione.quizDati = domande // Salviamo in RAM per chi perde la connessione
      // Passiamo anche l'array di domande al client
      io.to(key).emit('quiz:inizio', { quiz: domande })
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
      
      // Logica per non perdere i dati se uno studente aggiorna la pagina (match per nome)
      let studenteEsistente = null;
      for (let [sId, dati] of sessione.studenti.entries()) {
        if (dati.nome === nome) {
          studenteEsistente = dati;
          sessione.studenti.delete(sId); // Rimuoviamo il vecchio socket id
          break;
        }
      }

      if (studenteEsistente) {
        // Aggiorniamo il socket id ma manteniamo voti e stato
        studenteEsistente.socketId = socket.id;
        studenteEsistente.online = true;
        sessione.studenti.set(socket.id, studenteEsistente);
      } else {
        // Studente nuovo
        sessione.studenti.set(socket.id, { 
          socketId: socket.id, 
          nome, 
          livello: 'base', 
          durata: 'corta', 
          voto: null,
          punteggio: 0,
          totale: 0,
          online: true 
        })
      }

      socket.emit('stato:item', { indice: sessione.indiceCorrente, visitaId: sessione.visitaId })
      
      // Se il quiz è già iniziato e uno studente si riconnette, glielo rimandiamo subito
      if (sessione.fase === 'quiz' && sessione.quizDati) {
        socket.emit('quiz:inizio', { quiz: sessione.quizDati })
      }
      
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

      // AGGIORNATO: Struttura log allineata a Docente.jsx
      io.to(key).emit('docente:nuovaAttivita', {
        nome: studente.nome,
        tipo: 'Cambio Modalità',
        dettaglio: `Livello: ${livello} - ${durata}`,
        orario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })
    }
  })

  socket.on('studente:invioQuiz', ({ codice, risposte, totaleDomande, corrette }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione && sessione.studenti.has(socket.id)) {
      const studente = sessione.studenti.get(socket.id)
      
      const voto = Math.round((corrette / totaleDomande) * 10)
      studente.voto = voto
      studente.punteggio = corrette
      studente.totale = totaleDomande
      
      // Manda la lista aggiornata per i log base
      const listaStudenti = Array.from(sessione.studenti.values())
      io.to(key).emit('sessione:studenti', listaStudenti)

      // Invia la classifica specifica per la tabella dei voti del docente
      const risultati = listaStudenti.filter(s => s.voto !== null).map(s => ({
        nome: s.nome,
        punteggio: s.punteggio,
        totale: s.totale,
        voto: s.voto
      }))
      io.to(key).emit('docente:risultatiQuiz', risultati)
    }
  })

  // --- DISCONNESSIONE ---
  socket.on('disconnect', () => {
    console.log(`Socket disconnesso: ${socket.id}`)
    sessioni.forEach((sessione, key) => {
      if (sessione.studenti.has(socket.id)) {
        // Non eliminiamo più lo studente per non perdere il voto, lo mettiamo solo offline
        const studente = sessione.studenti.get(socket.id)
        studente.online = false
        
        const listaStudenti = Array.from(sessione.studenti.values())
        io.to(key).emit('sessione:studenti', listaStudenti)
      }
    })
  })
})

// --- MIDDLEWARE E ROTTE EXPRESS ---
app.use(cors())
app.use(express.json())

// NUOVO: Endpoint per salvare i voti. Inserito prima delle altre rotte visite
app.post('/api/visite/:visitaId/voti', async (req, res) => {
  const { visitaId } = req.params;
  const { codiceSessione, risultati } = req.body;
  
  console.log(`Salvando i voti nel DB per la visita ${visitaId} (Sessione: ${codiceSessione})`);
  
  try {
    const Visita = require('./models/Visita');
    
    // Aggiorniamo il documento Visita inserendo lo storico della sessione
    // Usiamo strict: false per garantire che il push avvenga anche se lo schema 
    // non è stato esplicitamente aggiornato con il campo "storicoLive"
    await Visita.findByIdAndUpdate(
      visitaId,
      {
        $push: {
          storicoLive: {
            codiceSessione,
            data: new Date(),
            risultati
          }
        }
      },
      { new: true, strict: false }
    );
    
    // Ritorna status 200 per confermare il salvataggio alla dashboard del docente
    res.status(200).json({ success: true, message: 'Voti salvati con successo.' });
  } catch (error) {
    console.error('Errore durante il salvataggio su MongoDB:', error);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
})

app.use('/api/auth', require('./routes/autenticazione'))
app.use('/api/musei', require('./routes/musei'))
app.use('/api/items', require('./routes/items'))
app.use('/api/visite', require('./routes/visite'))
app.use('/api/ai', require('./routes/ai'))

app.get('/api-status', (req, res) => {
  res.json({ messaggio: 'ArtAround backend funziona' })
})

app.use(express.static(path.join(__dirname, '../../marketplace')))

// Il Navigator e' l'altra applicazione. Una volta compilato (npm run build) diventa una
// cartella di file statici che serviamo qui sotto /navigator: cosi' marketplace, Navigator e
// API stanno sulla stessa origine e nel codice non c'e' nessun indirizzo scritto a mano.
// Finche' non e' compilato — cioe' mentre si sviluppa — si usa il server di Vite sulla 5173,
// e qui ci limitiamo a mandare li' chi arriva per sbaglio.
const cartellaNavigator = path.join(__dirname, '../../navigator/dist')
if (fs.existsSync(cartellaNavigator)) {
  app.use('/navigator', express.static(cartellaNavigator))
  // le rotte del Navigator non sono file: qualunque percorso riporta alla sua pagina
  app.get(/^\/navigator(\/.*)?$/, (req, res) => res.sendFile(path.join(cartellaNavigator, 'index.html')))
} else {
  app.get(/^\/navigator(\/.*)?$/, (req, res) => res.redirect(`http://${req.hostname}:5173`))
}

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