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
      // 1. Trier par score décroissant et date ascendante
      { $sort: { value: -1} },

      // 2. Grouper par utilisateur en gardant le document complet du meilleur score
      {
        $group: {
          _id: "$user",
          bestDoc: { $first: "$$ROOT" },
          totalScores: { $sum: "$value" },
          totalMissedClicks: { $sum: "$missedClicks" },
        },
      },

      // 3. Trier les groupes par meilleur score (optionnel)
      { $sort: { "bestDoc.value": -1, "bestDoc.missedClicks": 1} },

      // 4. Limiter à 25 utilisateurs
      { $limit: 25 },

      // 5. Jointure avec la collection users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },

      // 6. Décomposer le tableau issu du lookup
      { $unwind: "$userDetails" },

      // 7. Projeter les champs désirés
      {
        $project: {
          _id: 0,
          user: "$userDetails.username",
          bestScore: "$bestDoc.value",
          bestScoreDate: "$bestDoc.date",
          missedClicks: "$bestDoc.missedClicks",
          precisionGlobal: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      "$totalScores",
                      { $add: ["$totalScores", "$totalMissedClicks"] },
                    ],
                  },
                  100,
                ],
              },
              2,
            ],
          },
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
