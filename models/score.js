const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true },
  missedClicks: { type: Number, default: 0 }, // Ajout des clics ratés
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Score', scoreSchema);
