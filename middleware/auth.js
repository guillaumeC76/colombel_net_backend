require("dotenv").config();

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token manquant !" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decodedToken); // Ajoutez ce log
    req.auth = { userId: decodedToken.userId };
    next();
  } catch (error) {
    console.error("Erreur dans le middleware auth.js :", error); // Ajoutez ce log
    res.status(401).json({ message: "Token invalide ou expiré." });
  }
};
