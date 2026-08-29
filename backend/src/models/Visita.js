const mongoose = require("mongoose")

// Una domanda del test finale della lezione sincrona.
// La forma e' quella che scrive il marketplace in configura.js: quattro opzioni
// e l'indice di quella giusta.
const domandaQuizSchema = new mongoose.Schema({
  quesito: { type: String, required: true },
  opzioni: [String],
  rispostaCorretta: { type: Number, default: 0 }
}, { _id: false })

const visitaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  museoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Museo', required: true },
  autoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utente', required: true },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    ordine: Number,
    opzionale: { type: Boolean, default: false },
    indicazioneLogistica: String
  }],
  infoLogistiche: String,
  pubblica: { type: Boolean, default: false },
  prezzo: { type: Number, default: 0 },
  nomeMnemonico: { type: String }, // es. "Fenice rossa"
  quiz: [domandaQuizSchema],      // Array delle domande a risposta multipla create dal docente
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Visita", visitaSchema)