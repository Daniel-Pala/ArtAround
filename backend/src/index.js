const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

const authRoutes = require('./src/routes/auth')
const museiRoutes = require('./src/routes/musei')
app.use('/api/auth', authRoutes)
app.use('/api/musei', museiRoutes)

// Route di test
app.get('/', (req, res) => {
  res.json({ messaggio: 'ArtAround backend funziona' })
})

// Connessione MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connesso a MongoDB')
    app.listen(process.env.PORT, () => {
      console.log(`Server avviato sulla porta ${process.env.PORT}`)
    })
  })
  .catch(err => {console.error('Errore connessione MongoDB:', err);
  process.exit(1);
  })