const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Serve per far parlare frontend e backend separati
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Importiamo le rotte di Daniel
const authRoutes = require('./routes/auth');
const museiRoutes = require('./routes/musei');
const itemsRoutes = require('./routes/items');
const visiteRoutes = require('./routes/visite');

// Middleware
app.use(express.json());
app.use(cors()); // Permette al tuo Marketplace di fare chiamate API senza essere bloccato

// Agganciamo le rotte di Daniel
app.use('/api/auth', authRoutes);
app.use('/api/musei', museiRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/visite', visiteRoutes);

// Connessione al DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connesso al Database di Daniel'))
  .catch(err => console.error('❌ Errore DB:', err));

app.listen(port, () => {
    console.log(`🚀 Backend API acceso su http://localhost:${port}`);
});