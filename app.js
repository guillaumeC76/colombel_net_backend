require("dotenv").config();

const express = require("express");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user");
const scoreRoutes = require("./routes/score");

const MONGO_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Connecté à MongoDB [${process.env.NODE_ENV}]`))
  .catch(() => console.log("Échec de connexion à MongoDB"));

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );

  // Réponse automatique pour les requêtes `OPTIONS`
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});


app.use(bodyParser.json());

app.use("/auth", userRoutes);
app.use("/scores", scoreRoutes);
app.get("/", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send("<h1>COUCOU</h1>");
});

module.exports = app;
