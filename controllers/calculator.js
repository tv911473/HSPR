const pool = require('../src/databasePromise');
const athlete = require('./athlete');
const Points = require('../models/pointsCalc');
const leaderCalc = require('../models/leaderCalc');

exports.postPoints = async (req, res) => {
    const { ala, vanusegrupp, athletes } = req.body;
    const hooaeg = new Date().getFullYear();

    if (!ala || !vanusegrupp || !athletes || !Array.isArray(athletes) || athletes.length === 0) {
        return res.status(400).json({ error: 'Kõik väljad on kohustuslikud!' });
    }

    try {
        for (const athleteData of athletes) {
            const { eesnimi, perenimi, sugu, meetrid } = athleteData;

            if (!eesnimi || !perenimi || !sugu || !meetrid) {
                return res.status(400).json({ error: 'Kõik väljad on kohustuslikud iga sportlase jaoks!' });
            }

            const athleteId = await athlete.getOrCreateAthlete(eesnimi, perenimi, sugu);

            const points = new Points(sugu, ala, meetrid);
            const punktid = points.calculatePoints();

            const insertResultSql = 'INSERT INTO tulemus (sportlane_id, ala, vanusegrupp, meetrid, punktid, hooaeg) VALUES (?, ?, ?, ?, ?, ?)';
            await pool.query(insertResultSql, [athleteId, ala, vanusegrupp, meetrid, punktid, hooaeg]);

            await updateEdetabel(athleteId, vanusegrupp, hooaeg);
        }

        res.status(200).json({ message: 'Andmed edukalt salvestatud!' });
    } catch (err) {
        console.error('Viga päringu töötlemisel:', err);
        res.status(500).json({ error: 'Päring ebaõnnestus!' });
    }
};

async function updateEdetabel(athleteId, vanusegrupp, hooaeg) {
    try {
        const checkExistingSql = 'SELECT punktid_sum FROM edetabel WHERE sportlane_id = ? AND hooaeg = ? AND vanusegrupp = ?';
        const [existingEntry] = await pool.query(checkExistingSql, [athleteId, hooaeg, vanusegrupp]);

        const queryResultsSql = 'SELECT ala, punktid, meetrid FROM tulemus WHERE sportlane_id = ? AND hooaeg = ? AND vanusegrupp = ?';
        const [results] = await pool.query(queryResultsSql, [athleteId, hooaeg, vanusegrupp]);

        const pointsData = {};
        results.forEach(result => {
            if (!pointsData[result.ala]) {
                pointsData[result.ala] = [];
            }
            pointsData[result.ala].push({ points: result.punktid, meters: result.meetrid, event: result.ala });
        });

        if (hasValidEventCounts(pointsData)) {
            const calculator = new leaderCalc(pointsData);
            const { totalPoints: punktidSum, detailedPoints } = calculator.calculateMaxTotalPoints();

            if (existingEntry.length > 0) {
                if (punktidSum > existingEntry[0].punktid_sum) {
                    const updateSql = 'UPDATE edetabel SET punktid_sum = ? WHERE sportlane_id = ? AND hooaeg = ? AND vanusegrupp = ?';
                    await pool.query(updateSql, [punktidSum, athleteId, hooaeg, vanusegrupp]);
                }
            } else {
                const insertSql = 'INSERT INTO edetabel (sportlane_id, punktid_sum, vanusegrupp, hooaeg) VALUES (?, ?, ?, ?)';
                await pool.query(insertSql, [athleteId, punktidSum, vanusegrupp, hooaeg]);
            }
        }
    } catch (err) {
        console.error('Error updating edetabel:', err);
    }
}

// Helper function to check for valid event counts
function hasValidEventCounts(pointsData) {
    let eventCounts = Object.values(pointsData).map(points => points.length);
    eventCounts.sort((a, b) => b - a);

    // Check for the 3+2+1 & 2 jumps pattern
    return eventCounts[0] >= 3 && eventCounts[1] >= 2 && eventCounts[2] >= 1 && pointsData['hüpe'].length >= 2;
}
