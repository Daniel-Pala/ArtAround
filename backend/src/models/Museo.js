const mongoose = require("mongoose")

const museoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  citta: { type: String, required: true },
  configFile: String // nome del file di configurazione per il navigator
})

module.exports = mongoose.model("Museo", museoSchema)