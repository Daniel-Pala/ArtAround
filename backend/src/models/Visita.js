const mongoose = require("mongoose")

// Una domanda del test finale della lezione sincrona.
// La forma è quella che scrive il marketplace in configura.js: quattro opzioni
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
  // La sequenza delle tappe è la loro posizione in questo array: non c'è nessun campo
  // "ordine", perché un numero scritto accanto alla posizione può solo contraddirla.
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    opzionale: { type: Boolean, default: false },
    indicazioneLogistica: String
  }],
  infoLogistiche: String,
  pubblica: { type: Boolean, default: false },
  // un percorso composto su richiesta di un visitatore: è suo e basta, non è merce del
  // negozio, quindi non compare negli elenchi del museo
  suMisura: { type: Boolean, default: false },
  prezzo: { type: Number, default: 0 },
  codiceMnemonico: { type: String }, // es. "Fenice rossa"
  quiz: [domandaQuizSchema], // il test finale della lezione sincrona
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Visita", visitaSchema)