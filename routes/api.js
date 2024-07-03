const express = require('express');
const router = express.Router();
const calculator = require('../controllers/calculator');
const results = require('../controllers/results');
const athlete = require('../controllers/athlete');
const user = require('../controllers/user');
const leaderboard = require('../controllers/leaderboard');
const auth = require('../controllers/user').userAuth;

// API endpoints
router.post('/user/login', user.userLogin);
router.post('/user/signup', user.userSignup);
router.get('/user/logout', user.userLogout);
router.get('/user/check-email', user.checkEmailExists);

router.post('/submit-result', auth, calculator.postPoints);

router.get('/leaderboard', leaderboard.getLeaderboardData);
router.get('/leaderboard/points-details/:id', leaderboard.getPointsDetails);
router.get('/seasons', leaderboard.getDistinctSeasons);

router.get('/recent-results', auth, results.getRecentResults);
router.put('/update-result/:id', auth, results.updateResult);
router.delete('/delete-result/:id', auth, results.deleteResult);

router.get('/athlete/firstNames', auth, athlete.getFirstNames);
router.get('/athlete/lastNames', auth, athlete.getLastNames);

module.exports = router;
