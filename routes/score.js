const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/score');
const authMiddleware = require('../middleware/auth');

router.post('/add', authMiddleware, scoreController.addScore);

router.get('/leaderboard', scoreController.getLeaderboard);

router.get('/user', authMiddleware, scoreController.getUserScores);

router.get('/userAllScores', authMiddleware, scoreController.getAllUserScores);

module.exports = router;
