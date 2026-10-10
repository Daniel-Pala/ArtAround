const express = require('express')
const mongoose = require('mongoose')
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
// l'origine è sempre una sola.
const io = new Server(server)

// Stato globale delle sessioni in RAM
const sessioni = new Map()

// Funzione helper per generare un codice stanza
const generaCodice = () => Math.random().toString(36).substring(2, 8).toUpperCase()
// Il codice della lezione la docente lo detta a voce ("fenice rossa"), quindi chi lo
// scrive può metterci uno spazio, un trattino o niente: vanno tolti tutti e due, altrimenti
// "FENICE-ROSSA" e "Fenice rossa" sono due stanze diverse. Da quando il codice è anche il
// permesso per leggere i testi, non combaciare vuol dire restare senza audioguida.
const normalizzaCodice = (str) => str ? str.trim().toUpperCase().replace(/[\s-]+/g, '') : ''

// Alle rotte Express serve sapere se un codice è quello di una lezione aperta: è così che
// uno studente legge i testi di una visita che non ha comprato. Esponiamo la ricerca e non
// la mappa, così da fuori si può solo chiedere "questo codice è di una lezione viva?".
app.locals.sessioneLive = (codice) => sessioni.get(normalizzaCodice(codice))

// L'elenco della classe, il feed delle attività e la tabella dei voti sono roba della
// docente: ci sono dentro i nomi e i voti dei compagni. Vanno al suo socket, non alla
// stanza, dove li riceverebbero anche gli studenti.
const alDocente = (sessione, evento, dati) => {
  if (sessione?.docenteSocketId) io.to(sessione.docenteSocketId).emit(evento, dati)
}
const mandaElenco = (sessione) => alDocente(sessione, 'sessione:studenti', Array.from(sessione.studenti.values()))

io.on('connection', (socket) => {
  console.log(`Socket connesso: ${socket.id}`)

  // --- EVENTI DOCENTE ---
  socket.on('docente:crea', ({ visitaId, codiceMnemonico }) => {
    const codiceRaw = codiceMnemonico || generaCodice()
    const codiceChiave = normalizzaCodice(codiceRaw)
    
    // Se la lezione con questo codice esiste già significa che la docente ha ricaricato
    // la pagina: la si riprende invece di ricrearla, altrimenti l'elenco della classe e
    // i voti del quiz ripartirebbero da zero mentre gli studenti sono ancora dentro.
    const esistente = sessioni.get(codiceChiave)
    if (esistente) {
      esistente.docenteSocketId = socket.id
    } else {
      sessioni.set(codiceChiave, {
        visitaId,
        codiceOriginale: codiceRaw,
        indiceCorrente: 0,
        fase: 'visita',
        quizDati: null, // Aggiunto per persistenza in caso di riconnessione
        docenteSocketId: socket.id,
        studenti: new Map()
      })
    }

    socket.join(codiceChiave)
    socket.emit('sessione:creata', { codice: codiceRaw })
    mandaElenco(sessioni.get(codiceChiave))
  })

  socket.on('docente:vaiA', ({ codice, indice }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione) {
      sessione.indiceCorrente = indice
      io.to(key).emit('stato:item', { indice, visitaId: sessione.visitaId })
    }
  })

  // La docente forza la riproduzione dell'audio a tutti gli studenti
  socket.on('docente:forzaAudio', ({ codice }) => {
    const key = normalizzaCodice(codice)
    if (sessioni.has(key)) {
      io.to(key).emit('studente:playAudio')
    }
  })

  // Nuovi comandi di gestione audio per il docente
  socket.on('docente:pausaAudio', ({ codice }) => {
    const key = normalizzaCodice(codice)
    if (sessioni.has(key)) {
      io.to(key).emit('studente:pausaAudio')
    }
  })

  socket.on('docente:riprendiAudio', ({ codice }) => {
    const key = normalizzaCodice(codice)
    if (sessioni.has(key)) {
      io.to(key).emit('studente:riprendiAudio')
    }
  })

  socket.on('docente:riavviaAudio', ({ codice }) => {
    const key = normalizzaCodice(codice)
    if (sessioni.has(key)) {
      io.to(key).emit('studente:riavviaAudio')
    }
  })

  socket.on('docente:avviaQuiz', ({ codice, domande }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione) {
      sessione.fase = 'quiz'
      sessione.quizDati = domande // Salviamo in RAM per chi perde la connessione
      // Passiamo l'array di domande al client
      io.to(key).emit('quiz:inizio', { quiz: domande })
    }
  })

  // Vecchio evento di chiusura, mantenuto per compatibilità
  // Nuovo evento sincronizzato per terminare la lezione forzatamente per tutti
  socket.on('termina_sessione', ({ codiceSessione }) => {
    const key = normalizzaCodice(codiceSessione)
    io.to(key).emit('sessione_terminata')
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
          livello: 'medio', 
          durata: '15s', 
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
      
      mandaElenco(sessione)
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
      
      mandaElenco(sessione)

      // Struttura log allineata alla dashboard del docente
      alDocente(sessione, 'docente:nuovaAttivita', {
        nome: studente.nome,
        tipo: 'Cambio Modalità',
        dettaglio: `Livello: ${livello} - ${durata}`,
        orario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })
    }
  })

  // TRACCIAMENTO AZIONI GENERICHE E COMANDI VOCALI STUDENTE
  socket.on('studente:azione', ({ codice, azione, dettaglio }) => {
    const key = normalizzaCodice(codice)
    const sessione = sessioni.get(key)
    if (sessione && sessione.studenti.has(socket.id)) {
      const studente = sessione.studenti.get(socket.id)
      alDocente(sessione, 'docente:nuovaAttivita', {
        nome: studente.nome,
        tipo: azione,
        dettaglio: dettaglio || '',
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
      mandaElenco(sessione)

      // Invia la classifica specifica per la tabella dei voti del docente
      const risultati = Array.from(sessione.studenti.values()).filter(s => s.voto !== null).map(s => ({
        nome: s.nome,
        punteggio: s.punteggio,
        totale: s.totale,
        voto: s.voto
      }))
      alDocente(sessione, 'docente:risultatiQuiz', risultati)

      // Registrazione dell'evento completamento quiz nel feed attività docente
      alDocente(sessione, 'docente:nuovaAttivita', {
        nome: studente.nome,
        tipo: 'Completato Quiz',
        dettaglio: `Voto: ${voto}/10 (${corrette}/${totaleDomande})`,
        orario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })
    }
  })

  // --- DISCONNESSIONE ---
  socket.on('disconnect', () => {
    console.log(`Socket disconnesso: ${socket.id}`)
    sessioni.forEach((sessione, key) => {
      if (sessione.studenti.has(socket.id)) {
        // Mantiene i dati dello studente (compreso il voto), contrassegnandolo offline
        const studente = sessione.studenti.get(socket.id)
        studente.online = false
        mandaElenco(sessione)
      }
      if (sessione.docenteSocketId === socket.id) sessione.docenteSocketId = null

      // Le stanze vivono in RAM: chiudere la finestra invece di premere "Chiudi sessione"
      // le lasciava lì per sempre. La stanza si libera quando non è rimasto nessuno, così
      // la docente che ricarica la pagina non interrompe la lezione alla classe.
      const qualcunoOnline = Array.from(sessione.studenti.values()).some(s => s.online)
      if (!sessione.docenteSocketId && !qualcunoOnline) sessioni.delete(key)
    })
  })
})

// --- MIDDLEWARE E ROTTE EXPRESS ---
app.use(express.json())

app.use('/api/auth', require('./routes/autenticazione'))
app.use('/api/musei', require('./routes/musei'))
app.use('/api/items', require('./routes/items'))
app.use('/api/visite', require('./routes/visite'))
app.use('/api/ai', require('./routes/ai'))
app.use('/api/admin', require('./routes/admin'))

app.get('/api-status', (req, res) => {
  res.json({ messaggio: 'ArtAround backend funziona' })
})

app.use(express.static(path.join(__dirname, '../../marketplace')))

// Il Navigator è l'altra applicazione. Una volta compilato (npm run build) diventa una
// cartella di file statici che serviamo qui sotto /navigator: così marketplace, Navigator e
// API stanno sulla stessa origine e nel codice non c'è nessun indirizzo scritto a mano.
// Finché non è compilato — cioè mentre si sviluppa — si usa il server di Vite sulla 5173,
// e qui ci limitiamo a mandare lì chi arriva per sbaglio.
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