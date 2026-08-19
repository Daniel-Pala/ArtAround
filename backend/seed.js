// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const Utente = require('./src/models/Utente');
const Museo = require('./src/models/Museo');
const Item = require('./src/models/Item');
const Visita = require('./src/models/Visita');

async function seedDatabase() {
  try {
    console.log("⏳ Connessione a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connesso a MongoDB.");

    console.log("🧹 Pulizia database esistente...");
    await Utente.deleteMany({});
    await Museo.deleteMany({});
    await Item.deleteMany({});
    await Visita.deleteMany({});

    // 1. UTENTI (Password base "12345678" gestita dall'hook pre-save di Utente.js)
    console.log("👤 Creazione utenti di test...");
    const docente = new Utente({ username: "docente", password: "12345678", ruolo: "autore" });
    await docente.save();

    const studente = new Utente({ username: "studente", password: "12345678", ruolo: "visitatore" });
    await studente.save();

    // 2. MUSEO
    console.log("🏛️ Creazione Museo...");
    const pinacoteca = new Museo({
      nome: "Pinacoteca Nazionale di Bologna",
      citta: "Bologna",
      configFile: "pinacoteca-bologna.json"
    });
    await pinacoteca.save();

    // 3. ITEMS (Opere con testi multi-livello e multi-durata)
    console.log("🖼️ Creazione Items/Opere...");
    const nomiOpere = [
      "Estasi di Santa Cecilia", "Strage degli Innocenti", "Ritratto di Guido Reni",
      "San Sebastiano", "Assunzione della Vergine", "San Girolamo",
      "Battesimo di Cristo", "Annunciazione", "Pietà", "Adorazione dei Magi"
    ];

    const itemIds = [];

    for (let i = 0; i < nomiOpere.length; i++) {
      const newItem = new Item({
        operaId: `item_${i + 1}`,
        museoId: pinacoteca._id,
        descrizione: `Opera d'arte n. ${i + 1} conservata presso la Pinacoteca.`,
        titolo: nomiOpere[i],
        testi: [
          { durata: '15s', livello: 'elementare', testo: `${nomiOpere[i]}: Spiegazione breve e semplice per scuole.` },
          { durata: '1min', livello: 'medio', testo: `${nomiOpere[i]}: Descrizione completa di contesto storico e artistico.` },
          { durata: '4min', livello: 'specialistico', testo: `${nomiOpere[i]}: Analisi tecnica dettagliata, iconografia e restauro.` }
        ],
        immagine: `https://via.placeholder.com/400x300?text=${encodeURIComponent(nomiOpere[i])}`,
        autoreId: docente._id,
        licenza: "CC-BY-NC",
        prezzo: 0
      });
      await newItem.save();
      itemIds.push(newItem._id);
    }

    // 4. VISITA GUIDATA PUBBLICA
    console.log("🗺️ Creazione Visita guidata completa...");
    const itemsPerVisita = itemIds.map((id, index) => ({
      itemId: id,
      ordine: index + 1,
      opzionale: false,
      indicazioneLogistica: `Sala ${Math.floor(index / 3) + 1} - Parete ${index % 2 === 0 ? 'Nord' : 'Sud'}`
    }));

    const visita = new Visita({
      nome: "Percorso Capolavori della Pinacoteca",
      museoId: pinacoteca._id,
      autoreId: docente._id,
      items: itemsPerVisita,
      infoLogistiche: "Partenza dal piano terra, seguire le frecce verdi.",
      pubblica: true,
      prezzo: 0
    });
    await visita.save();

    console.log("🎉 POPOLAMENTO COMPLETATO CON SUCCESSO!");
  } catch (error) {
    console.error("❌ Errore durante il popolamento:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Connessione database chiusa.");
  }
}

seedDatabase();