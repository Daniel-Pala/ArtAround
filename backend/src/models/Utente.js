const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const utenteSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ruolo: { type: String, enum: ['autore', 'visitatore'], default: 'visitatore' },
  createdAt: { type: Date, default: Date.now }
})

// Cifra la password prima di salvarla
utenteSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
})

module.exports = mongoose.model("Utente", utenteSchema)