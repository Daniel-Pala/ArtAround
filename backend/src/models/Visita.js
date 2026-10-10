const mongoose = require("mongoose")

// Una domanda del test finale della lezione sincrona.
// La forma è quella che scrive il marketplace in configura.js: quattro opzioni
// e l'indice di quella giusta.
const domandaQuizSchema = new mongoose.Schema({
  quesito: { type: String, required: true },
  opzioni: [String],
  rispostaCorretta: { type: Number, default: 0 }
}, { _id: false })

// Lo storico delle lezioni live: una riga per sessione, con i voti del quiz.
// Sta nello schema invece di essere scritto di straforo con strict:false, così mongoose
// controlla i campi: è proprio con strict:false che codiceMnemonico veniva scartato in
// silenzio e il nome mnemonico è rimasto perso per settimane.
const esitoQuizSchema = new mongoose.Schema({
  nome: String,
  punteggio: Number,
  totale: Number,
  voto: Number
}, { _id: false })

const sessioneLiveSchema = new mongoose.Schema({
  codiceSessione: String,
  data: { type: Date, default: Date.now },
  risultati: [esitoQuizSchema]
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
  // un percorso composto su richiesta di un visitatore: è suo e basta, non è merce del
  // negozio, quindi non compare negli elenchi del museo
  suMisura: { type: Boolean, default: false },
  prezzo: { type: Number, default: 0 },
  codiceMnemonico: { type: String }, // es. "Fenice rossa"
  quiz: [domandaQuizSchema],      // Array delle domande a risposta multipla create dal docente
  storicoLive: [sessioneLiveSchema],
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Visita", visitaSchema)