const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

// --- LOG DI DEBUG ---
// Questo middleware scriverà nel terminale ogni chiamata che arriva al server
app.use((req, res, next) => {
  console.log(`[DEBUG CHIAMATA]: ${req.method} ${req.url}`);
  next();
});

// 1. ROTTE API
const authRoutes = require('./routes/auth')
const museiRoutes = require('./routes/musei')
const itemsRoutes = require('./routes/items')
const visiteRoutes = require('./routes/visite')

app.use('/api/auth', authRoutes)
app.use('/api/musei', museiRoutes)
app.use('/api/items', itemsRoutes)
app.use('/api/visite', visiteRoutes)

app.get('/api-status', (req, res) => {
  res.json({ messaggio: 'ArtAround backend funziona' })
})

// 2. FILE STATICI
app.use(express.static(path.join(__dirname, '../../marketplace')))

// 3. FALLBACK (Gestione errori 404)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    // QUI TI ACCORGERAI DI COSA SBAGLIA IL FRONTEND
    console.error(`[ERRORE 404]: Tentativo di accesso a rotta inesistente -> ${req.url}`);
    return res.status(404).json({ message: 'Endpoint API non trovato' })
  }
  res.sendFile(path.join(__dirname, '../../marketplace/index.html'))
})

// Connessione MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connesso a MongoDB')
    app.listen(process.env.PORT, () => {
      console.log(`Server avviato sulla porta ${process.env.PORT}`)
    })
  })
  .catch(err => {
    console.error('Errore connessione MongoDB:', err)
    process.exit(1)
  })