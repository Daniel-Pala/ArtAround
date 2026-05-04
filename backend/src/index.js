const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

// Serve i file statici del marketplace (login.html, index.html, app.js, ecc.)
// così tutto vive sotto http://localhost:3000 — stesso origin, un solo localStorage.
app.use(express.static(path.join(__dirname, '../../marketplace')))

const authRoutes = require('./routes/auth')
const museiRoutes = require('./routes/musei')
const itemsRoutes = require('./routes/items')
const visiteRoutes = require('./routes/visite')
app.use('/api/auth', authRoutes)
app.use('/api/musei', museiRoutes)
app.use('/api/items', itemsRoutes)
app.use('/api/visite', visiteRoutes)

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