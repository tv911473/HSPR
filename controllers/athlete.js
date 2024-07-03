const pool = require('../src/databasePromise');

exports.getOrCreateAthlete = async (firstName, lastName, gender) => {
    const selectSql = 'SELECT id FROM sportlane WHERE eesnimi = ? AND perenimi = ? AND sugu = ?';
    const insertSql = 'INSERT INTO sportlane (eesnimi, perenimi, sugu) VALUES (?, ?, ?)';

    try {
        const [result] = await pool.query(selectSql, [firstName, lastName, gender]);

        if (result.length > 0) {
            return result[0].id; // Return athlete ID if exists
        } else {
            const [insertResult] = await pool.query(insertSql, [firstName, lastName, gender]);
            return insertResult.insertId; // Return new athlete ID
        }
    } catch (err) {
        console.error('Andmebaasi error:', err);
        throw new Error('Viga: ei saa sisestada või kätte saada sportlast');
    }
};

exports.getAthlete = async (req, res) => {
    const { firstName, lastName, gender } = req.query;

    try {
        const athleteId = await exports.getOrCreateAthlete(firstName, lastName, gender);
        res.json({ athleteId });
    } catch (err) {
        console.error('Andmebaasi päringu error:', err);
        return res.status(500).send('Viga: ei saa andmebaasist sportlast');
    }
};

exports.postAthlete = async (req, res) => {
    const { firstName, lastName, gender } = req.body;
    try {
        const athleteId = await exports.getOrCreateAthlete(firstName, lastName, gender);
        res.json({ athleteId });
    } catch (err) {
        console.error('Andmebaasi sisestamise error:', err);
        return res.status(500).send('Viga: ei saa sisestada sportlast');
    }
};

// Firstname autofill
exports.getFirstNames = async (req, res) => {
    const { prefix } = req.query;
    const selectSql = 'SELECT eesnimi, perenimi, sugu FROM sportlane WHERE eesnimi LIKE ?';
    try {
        const [result] = await pool.query(selectSql, [`${prefix}%`]);
        res.json(result);
    } catch (err) {
        console.error('Andmebaasi päringu:', err);
        res.status(500).send('Viga: ei saa eesnime');
    }
};

// Lastname autofill
exports.getLastNames = async (req, res) => {
    const { prefix } = req.query;
    const selectSql = 'SELECT eesnimi, perenimi, sugu FROM sportlane WHERE perenimi LIKE ?';
    try {
        const [result] = await pool.query(selectSql, [`${prefix}%`]);
        res.json(result);
    } catch (err) {
        console.error('Andmebaasi päringu error:', err);
        res.status(500).send('Viga: ei saa perenime');
    }
};
