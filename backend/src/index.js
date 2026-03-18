const express = require('express');
const hbs = require('hbs');
const path = require('path');
require('dotenv').config();

// 1. CREIAMO L'APP (Questa riga DEVE stare sopra le altre)
const app = express(); 

const port = process.env.PORT || 3000;

const authRoutes = require('./routes/auth')
const museiRoutes = require('./routes/musei')
const itemsRoutes = require('./routes/items')
const visiteRoutes = require('./routes/visite')
app.use('/api/auth', authRoutes)
app.use('/api/musei', museiRoutes)
app.use('/api/items', itemsRoutes)
app.use('/api/visite', visiteRoutes)

// Route di test
// 2. CONFIGURIAMO L'APP
app.set('view engine', 'hbs');

// Qui diciamo a Node che la cartella 'views' è un livello sopra rispetto a 'src'
app.set('views', path.join(__dirname, '../view'));

// 3. DEFINIAMO LE ROTTE
app.get('/', (req, res) => {
    res.render('marketplace'); 
});

// 4. ACCENDIAMO IL MOTORE
app.listen(port, () => {
    console.log(`Server acceso su http://localhost:${port}`);
});