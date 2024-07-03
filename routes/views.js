const express = require('express');
const router = express.Router();
const auth = require('../controllers/user').userAuth;
const leaderboard = require('../controllers/leaderboard');
const results = require('../controllers/results');

// View rendering endpoints
router.get('/user/login', (req, res) => {
    res.render('login');
});

router.get('/user/signup', (req, res) => {
    res.render('signup');
});
router.get('/addresults', auth, (req, res) => {
    res.render('addresults');
});
router.get('/allresults', auth, results.renderRecentResults);
router.get('/', leaderboard.renderLeaderboardData);

module.exports = router;
