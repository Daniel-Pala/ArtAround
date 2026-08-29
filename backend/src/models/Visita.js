const mongoose = require("mongoose")

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