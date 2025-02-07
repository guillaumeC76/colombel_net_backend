require("dotenv").config();

const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérification des champs requis
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Erreur : Tous les champs sont oligatoires." });
    }

    // Vérification de la longueur des champs
    if (username.length < 1 || username.length > 30) {
      return res.status(400).json({ message: "Le pseudo doit contenir entre 1 et 30 caractères." });
    }
    if (email.length > 60) {
      return res.status(400).json({ message: "L'email ne doit pas dépasser 60 caractères." });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.login = (req, res, next) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user === null) {
        res
          .status(401)
          .json({ message: "Paire identifiant/mot de passe incorrect !" });
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            if (!valid) {
              res.status(401).json({
                message: "Paire identifiant/mot de passe incorrect !",
              });
            } else {
              res.status(200).json({
                token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
                  expiresIn: "24h",
                }),
                user: {
                  id: user._id,
                  username: user.username,
                  email: user.email,
                },
              });
            }
          })
          .catch((error) => {
            res.status(500).json({ error });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { username, email, password, confirmPassword } = req.body;

    const updatedFields = {};

    // Validation des champs
    if (username) {
      if (username.length < 1 || username.length > 30) {
        return res.status(400).json({ message: "Le pseudo doit contenir entre 1 et 30 caractères." });
      }
      updatedFields.username = username;
    }
    if (email) {
      if (email.length > 60) {
        return res.status(400).json({ message: "L'email ne doit pas dépasser 60 caractères." });
      }
      updatedFields.email = email;
    }

    // Gestion des mots de passe
    if (password) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        updatedFields.password = hashedPassword;
      } catch (hashError) {
        console.error("Erreur lors du hachage du mot de passe :", hashError);
        return res.status(500).json({ message: "Erreur serveur lors du hachage du mot de passe." });
      }
    }

    // Mise à jour des champs
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });

    res.status(200).json({
      message: "Informations mises à jour avec succès.",
      user: { username: updatedUser.username, email: updatedUser.email },
    });
  } catch (error) {
    console.error("Erreur générale dans updateUser :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour des informations." });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select("username email");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des informations utilisateur :",
      error
    );
    res.status(500).json({ message: "Erreur serveur." });
  }
};
