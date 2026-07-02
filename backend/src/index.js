const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

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