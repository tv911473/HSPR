const pool = require('../src/databasePromise');
const PointsCalculator = require('../models/leaderCalc');

const fetchDistinctSeasons = async () => {
    const query = `
        SELECT DISTINCT hooaeg FROM tulemus ORDER BY hooaeg DESC;
    `;
    try {
        const [seasons] = await pool.query(query);
        return seasons;
    } catch (error) {
        console.error('Viga kõikide hooaegade kättesaamisel:', error);
        throw error;
    }
};

exports.getDistinctSeasons = async (req, res) => {
    try {
        const seasons = await fetchDistinctSeasons();
        res.json(seasons);
    } catch (error) {
        res.status(500).send('Viga: ei saa kätte hooaegasid');
    }
};

const fetchLeaderboardData = async (season, sugu, vanusegrupp, name) => {
    let query = `
        SELECT
            edetabel.vanusegrupp,
            edetabel.hooaeg,
            edetabel.punktid_sum,
            sportlane.eesnimi,
            sportlane.perenimi,
            sportlane.sugu,
            sportlane.id AS sportlane_id  -- Include the athlete ID
        FROM
            edetabel
        JOIN
            sportlane ON edetabel.sportlane_id = sportlane.id
        WHERE
            (? IS NULL OR edetabel.hooaeg = ?)
    `;
    
    const queryParams = [season ? null : season, season];

    if (sugu) {
        query += ` AND sportlane.sugu = ?`;
        queryParams.push(sugu);
    }
    if (vanusegrupp) {
        query += ` AND edetabel.vanusegrupp = ?`;
        queryParams.push(vanusegrupp);
    }
    if (name) {
        query += ` AND (sportlane.eesnimi LIKE ? OR sportlane.perenimi LIKE ?)`;
        queryParams.push(`${name}%`, `${name}%`);
    }

    if(season){
        query += ` AND (edetabel.hooaeg = ?)`;
        queryParams.push(season);
    } else {
        query += ` AND edetabel.hooaeg = (SELECT MAX(hooaeg) FROM edetabel)`;
        queryParams.push(season);
    }

    query += ` ORDER BY punktid_sum DESC`;

    try {
        const [leaderboardData] = await pool.query(query, queryParams);
        return leaderboardData;
    } catch (error) {
        console.error('Viga edetabeli andmete kättesaamisel:', error);
        throw error;
    }
};

exports.getLeaderboardData = async (req, res) => {
    const sugu = req.query.sugu || null;
    const vanusegrupp = req.query.vanusegrupp || null;
    const name = req.query.name || null;

    try {
        let season = req.query.season;
        if (!season) {
            season = await fetchMaxSeason();
        }

        const leaderboardData = await fetchLeaderboardData(season, sugu, vanusegrupp, name);
        res.json({season, data: leaderboardData});
    } catch (error) {
        res.status(500).send('Viga: ei saa edetabeli andmeid kätte');
    }
};

exports.renderLeaderboardData = async (req, res) => {
    const sugu = req.query.sugu || null;
    const vanusegrupp = req.query.vanusegrupp || null;
    const name = req.query.name || null;

    try {
        let season = req.query.season;
        if (!season) {
            season = await fetchMaxSeason();
        }

        const leaderboardData = await fetchLeaderboardData(season, sugu, vanusegrupp, name);
        res.render('leaderboard', { recentData: leaderboardData });
    } catch (error) {
        console.error('Viga edetabeli andmete rendertamisel:', error);
        res.status(500).send('Viga: ei saa edetabeli andmeid renderdada');
    }
};

const fetchMaxSeason = async () => {
    const query = `
        SELECT MAX(hooaeg) AS maxSeason FROM edetabel;
    `;
    try {
        const [result] = await pool.query(query);
        return result[0].maxSeason;
    } catch (error) {
        console.error('Error viimase hooaja kättesaamisel:', error);
        throw error;
    }
};

exports.getPointsDetails = async (req, res) => {
    const athleteId = req.params.id;
    const hooaeg = req.query.hooaeg || new Date().getFullYear();
    const vanusegrupp = req.query.vanusegrupp;

    if (!vanusegrupp) {
        return res.status(400).json({ error: 'Vanusegrupp on kohustuslik' });
    }

    try {
        const query = `
            SELECT ala, punktid, meetrid 
            FROM tulemus 
            WHERE sportlane_id = ? AND hooaeg = ? AND vanusegrupp = ?
            ORDER BY punktid DESC
        `;
        const [results] = await pool.query(query, [athleteId, hooaeg, vanusegrupp]);

        const pointsData = {};
        results.forEach(result => {
            if (!pointsData[result.ala]) {
                pointsData[result.ala] = [];
            }
            pointsData[result.ala].push({ points: result.punktid, meters: result.meetrid });
        });

        const calculator = new PointsCalculator(pointsData);
        const { totalPoints, detailedPoints } = calculator.calculateMaxTotalPoints();

        res.json({
            totalPoints,
            detailedPoints
        });
    } catch (error) {
        console.error('Error fetching points details:', error);
        res.status(500).json({ error: 'Failed to fetch points details' });
    }
};