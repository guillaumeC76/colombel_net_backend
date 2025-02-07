const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 1,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 60, // Limite de caractères pour l'email
    unique: true,
  },
  password: { type: String, required: true },
});

module.exports = mongoose.model("User", userSchema);
