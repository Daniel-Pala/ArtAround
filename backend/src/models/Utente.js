const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const utenteSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  ruolo: { type: String, enum: ['autore', 'visitatore'], default: 'visitatore' },
  acquisti: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Visita', default: [] }], // Corretto: Nome allineato alle rotte e default sicuro
  createdAt: { type: Date, default: Date.now }
})

utenteSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
})

module.exports = mongoose.model("Utente", utenteSchema)