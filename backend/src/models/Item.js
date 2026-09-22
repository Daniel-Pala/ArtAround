const mongoose = require("mongoose");

const testoSchema = new mongoose.Schema({
  durata: { type: String, enum: ['3s', '15s', '1min', '4min'], required: true },
  livello: { type: String, enum: ['infantile', 'elementare', 'medio', 'specialistico'], required: true },
  testo: { type: String, required: true },
  // la lingua del testo. I testi scritti prima che esistesse questo campo non ce l'hanno:
  // valgono come italiano, quindi ovunque si legge (t.lingua || 'it')
  lingua: { type: String, enum: ['it', 'en', 'fr', 'es', 'de'], default: 'it' },
  // il nome del modello che l'ha scritto, vuoto se l'ha scritto una persona.
  // Sta qui e non su Item perché lo stesso item può avere un testo del curatore
  // e uno generato: la provenienza è del singolo testo, non dell'opera.
  generatoDa: { type: String }
});

const itemSchema = new mongoose.Schema({
  operaId: { type: String, required: true },
  // un item può parlare di un oggetto esposto oppure di un contenuto associato
  // (un movimento, uno stile, un artista): questi ultimi non stanno sulla mappa
  tipo: { type: String, enum: ['opera', 'approfondimento'], default: 'opera' },
  museoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Museo', required: true },
  descrizione: { type: String }, // didascalia da cartellino: autore, data, tecnica
  // chi ha dipinto l'opera e a che movimento appartiene. Sono già dentro la didascalia,
  // ma qui stanno separati perché i comandi "chi è l'autore" e "qual è lo stile"
  // devono pronunciare solo quelli. Da non confondere con autoreId, che è chi ha
  // scritto l'item.
  autoreOpera: { type: String },
  stile: { type: String },
  titolo: { type: String, required: true },
  testi: [testoSchema],
  immagine: String,
  autoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utente', required: true },
  licenza: { type: String, required: true },
  prezzo: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Item", itemSchema);