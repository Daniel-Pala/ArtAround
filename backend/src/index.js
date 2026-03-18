const express = require('express');
const hbs = require('hbs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express(); 
const port = process.env.PORT || 3000;

// Importiamo i modelli di Daniel (User e Museo)
const Utente = require('./models/Utente'); 
const Museo = require('./models/Museo'); 

// Rotte API di Daniel
const authRoutes = require('./routes/auth');
const museiRoutes = require('./routes/musei');
const itemsRoutes = require('./routes/items');
const visiteRoutes = require('./routes/visite');

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/musei', museiRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/visite', visiteRoutes);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../view'));

// Connessione al DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connesso al Database di Daniel'))
  .catch(err => console.error('❌ Errore di connessione al DB:', err));

// Tua rotta Marketplace
app.get('/', async (req, res) => {
    try {
        // Leggiamo solo quello che c'è davvero nel database
        const listaMusei = await Museo.find(); 
        res.render('marketplace', { utente: "Mattia", musei: listaMusei });
    } catch (error) {
        res.render('marketplace', { utente: "Mattia", musei: [] });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server pronto su http://localhost:${port}`);
});