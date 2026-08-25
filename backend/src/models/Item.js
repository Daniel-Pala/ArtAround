const mongoose = require("mongoose");

const testoSchema = new mongoose.Schema({
  durata: { type: String, enum: ['3s', '15s', '1min', '4min'], required: true },
  livello: { type: String, enum: ['infantile', 'elementare', 'medio', 'specialistico'], required: true },
  testo: { type: String, required: true }
});

const itemSchema = new mongoose.Schema({
  operaId: { type: String, required: true },
  // un item puo' parlare di un oggetto esposto oppure di un contenuto associato
  // (un movimento, uno stile, un artista): questi ultimi non stanno sulla mappa
  tipo: { type: String, enum: ['opera', 'approfondimento'], default: 'opera' },
  museoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Museo', required: true },
  descrizione: { type: String }, // didascalia da cartellino: autore, data, tecnica
  titolo: { type: String, required: true },
  testi: [testoSchema],
  immagine: String,
  autoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utente', required: true },
  licenza: { type: String, required: true },
  prezzo: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Item", itemSchema);