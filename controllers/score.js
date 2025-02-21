const Score = require("../models/score");

// Enregistrer un nouveau score
exports.addScore = async (req, res) => {
  try {
    const { value, missedClicks } = req.body;
    if (value === undefined || missedClicks === undefined) {
      return res.status(400).json({ message: "Score et clics ratés requis." });
    }

    const userId = req.auth.userId;

    const newScore = new Score({
      user: userId,
      value,
      missedClicks,
    });

    await newScore.save();

    res.status(201).json({ message: "Score enregistré avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'ajout du score :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de l'enregistrement du score." });
  }
};

// Récupérer les 10 derniers scores de l'utilisateur
exports.getUserScores = async (req, res) => {
  try {
    const userId = req.auth.userId; // Récupère l'ID de l'utilisateur authentifié

    // Récupère les 10 meilleurs scores triés par ordre décroissant de la valeur
    const scores = await Score.find({ user: userId })
      .sort({ value: -1 }) // Trie par valeur décroissante
      .limit(10); // Limite à 10 scores

    res.status(200).json(scores); // Renvoie les scores
  } catch (error) {
    console.error("Erreur dans getUserScores :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des scores." });
  }
};

exports.getAllUserScores = async (req, res) => {
  try {
    const userId = req.auth.userId; // Récupère l'ID de l'utilisateur authentifié

    const scores = await Score.find({ user: userId });

    res.status(200).json(scores); // Renvoie les scores
  } catch (error) {
    console.error("Erreur dans getAllUserScores :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des scores." });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    console.log("Début récupération du leaderboard");

    const count = await Score.countDocuments();
    console.log(`Nombre total de scores en base : ${count}`);

    if (count === 0) {
      return res.status(200).json({ message: "Aucun score enregistré." });
    }

    const leaderboard = await Score.aggregate([
      // 1. Ajouter un champ précision sur chaque document
      {
        $addFields: {
          precision: {
            $multiply: [
              { $divide: [{ $subtract: ["$value", "$missedClicks"] }, "$value"] },
              100,
            ],
          },
        },
      },

      // 2. Trier d'abord par score décroissant puis par précision décroissante
      { $sort: { value: -1, precision: -1 } },

      // 3. Grouper par utilisateur en gardant le meilleur score avec la meilleure précision
      {
        $group: {
          _id: "$user",
          bestDoc: { $first: "$$ROOT" }, // On prend le premier après le tri (meilleur score et meilleure précision)
        },
      },

      // 4. Trier les groupes par meilleur score (optionnel)
      { $sort: { "bestDoc.value": -1 } },

      // 5. Limiter à 25 utilisateurs
      { $limit: 25 },

      // 6. Jointure avec la collection users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },

      // 7. Décomposer le tableau issu du lookup
      { $unwind: "$userDetails" },

      // 8. Projeter les champs désirés
      {
        $project: {
          _id: 0,
          user: "$userDetails.username",
          bestScore: "$bestDoc.value",
          bestScoreDate: "$bestDoc.date",
          missedClicks: "$bestDoc.missedClicks",
          precision: { $round: ["$bestDoc.precision", 2] }, // Arrondi à 2 décimales
        },
      },
    ]);

    console.log("Leaderboard récupéré avec succès :", leaderboard);
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Erreur dans getLeaderboard :", error);
    res.status(500).json({
      message: "Erreur lors de la récupération du classement général.",
      error: error.message,
    });
  }
};

