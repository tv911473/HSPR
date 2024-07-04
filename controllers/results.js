const pool = require('../src/databasePromise').pool;
const Points = require('../models/pointsCalc');
const cron = require('node-cron');

// Helper function to fetch recent results, fetchRecentResults function now accepts a searchParams object containing optional eesnimi, perenimi, ala, and hooaeg fields.
// The SQL query dynamically adds WHERE clauses based on the provided search parameters, and the queryParams array is updated accordingly.
const fetchRecentResults = (limit, searchParams, callback) => {
    let query = `
        SELECT
            tulemus.id,
            sportlane.eesnimi,
            sportlane.perenimi,
            sportlane.sugu,
            tulemus.ala,
            tulemus.vanusegrupp,
            tulemus.meetrid,
            tulemus.punktid,
            tulemus.hooaeg
        FROM
            tulemus
        JOIN sportlane ON tulemus.sportlane_id = sportlane.id
        WHERE 1=1
    `;

    const queryParams = [];
    const currentYear = new Date().getFullYear();

    if (searchParams.eesnimi) {
        query += ` AND sportlane.eesnimi LIKE ?`;
        queryParams.push(`%${searchParams.eesnimi}%`);
    }
    if (searchParams.perenimi) {
        query += ` AND sportlane.perenimi LIKE ?`;
        queryParams.push(`%${searchParams.perenimi}%`);
    }
    if (searchParams.ala) {
        query += ` AND tulemus.ala LIKE ?`;
        queryParams.push(`%${searchParams.ala}%`);
    }
    if (searchParams.hooaeg) {
        query += ` AND tulemus.hooaeg LIKE ?`;
        queryParams.push(`%${searchParams.hooaeg}%`);
    } else {
        query += ` AND tulemus.hooaeg = ?`;
        queryParams.push(currentYear);
    }

    query += ` ORDER BY tulemus.id DESC`;

    query += ` LIMIT ?`;
    queryParams.push(limit);


    pool.query(query, queryParams, (error, results) => {
        if (error) {
            console.error('Viga viimaste tulemuste kättesaamisel:', error);
            return callback(error, null);
        }
        callback(null, results);
    });
};

// The getRecentResults and renderRecentResults endpoints read eesnimi, perenimi, ala, and hooaeg
// from the request query parameters and pass them to fetchRecentResults.
// Get recent results and send as JSON, added sorting and searching functionality
exports.getRecentResults = (req, res) => {
    const limit = parseInt(req.query.limit) || 30;
    const searchParams = {
        eesnimi: req.query.eesnimi || null,
        perenimi: req.query.perenimi || null,
        ala: req.query.ala || null,
        hooaeg: req.query.hooaeg || null
    };


    fetchRecentResults(limit, searchParams, (error, results) => {
        if (error) {
            return res.status(500).send('Viga: ei saa kätte viimaseid tulemusi');
        }
        res.json(results);
    });
};

// Use fetchRecentResults for other functionalities if needed, e.g., rendering templates
exports.renderRecentResults = (req, res) => {
    const limit = 30;
    const searchParams = {
        eesnimi: req.query.eesnimi || null,
        perenimi: req.query.perenimi || null,
        ala: req.query.ala || null,
        hooaeg: req.query.hooaeg || null
    };

    let errorMessage = '';

    fetchRecentResults(limit, searchParams, (error, results) => {
        if (error) {
            return res.status(500).send('Viga viimaste tulemuste kättesaamisel tulemuste renderdamisel');
        }

        if (results.length === 0) {
            errorMessage = 'Selliste parameetritega vastust ei leitud';
        }

        res.render('allresults', {
            recentResults: results,
            searchParams,
            errorMessage
        });
    });
};

// Update results
exports.updateResult = (req, res) => {
    const { id } = req.params;
    const { eesnimi, perenimi, meetrid, sugu, ala } = req.body;

    if (!id || !eesnimi || !perenimi || !meetrid || !sugu || !ala) {
        console.error('Missing fields:', { id, eesnimi, perenimi, meetrid, sugu, ala });
        return res.status(400).json({ error: 'All fields are required!' });
    }

    try {
        const points = new Points(sugu, ala, parseFloat(meetrid));
        const punktid = points.calculatePoints();

        // First, update the name in the sportlane table
        const query1 = `
            UPDATE sportlane
                JOIN tulemus ON tulemus.sportlane_id = sportlane.id
            SET sportlane.eesnimi = ?, sportlane.perenimi = ?
            WHERE tulemus.id = ?;
        `;

        // Then, update the tulemus table
        const query2 = `
            UPDATE tulemus
            SET meetrid = ?, punktid = ?
            WHERE id = ?;
        `;

        pool.query(query1, [eesnimi, perenimi, id], (error, result) => {
            if (error) {
                console.error('Error updating sportlane:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            pool.query(query2, [meetrid, punktid, id], (error, result) => {
                if (error) {
                    console.error('Error updating tulemus:', error);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                if (result.affectedRows > 0) {
                    res.status(200).json({ message: 'Result updated successfully!' });
                } else {
                    res.status(404).json({ error: 'Result not found!' });
                }
            });
        });

    } catch (error) {
        console.error('Error calculating points:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete result
exports.deleteResult = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Tulemuse ID on vajalik!' });
    }

    const query = `
        DELETE FROM tulemus
        WHERE id = ?;
    `;
    pool.query(query, [id], (error, result) => {
        if (error) {
            console.error('Viga tulemuse kustutamisel:', error);
            return res.status(500).json({ error: 'Viga tulemuse kustutamisel' });
        }
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Tulemus edukalt kustutatud!' });
        } else {
            res.status(404).json({ error: 'Tulemust ei leitud!' });
        }
    });
};

// Schedulede delete for "tulemus" tabel at 1st & 8th of december
cron.schedule('0 0 1,8 12 *', () => {
    const season = new Date().getFullYear();
    const deleteQuery = `
        DELETE FROM tulemus
        WHERE hooaeg = ? AND NOT EXISTS (
            SELECT 1
            FROM edetabel
            WHERE edetabel.sportlane_id = tulemus.sportlane_id
            AND edetabel.vanusegrupp = tulemus.vanusegrupp
            AND edetabel.hooaeg = ?
        )
    `;
    pool.query(deleteQuery, [season, season], (error, result) => {
        if (error) {
            console.error('Viga tulemuste kustutamisel:', error);
        }
    })
});