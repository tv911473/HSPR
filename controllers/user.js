const pool = require('../src/databasePromise');
const bcrypt = require('bcrypt');

exports.userSignup = async (req, res) => {
    const { email, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.json({ success: false, error });
    }

    try {
        const [existingUser] = await pool.execute('SELECT * FROM konto WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.json({ success: false, error });
        }

        // Hash the password
        const password_hash = await bcrypt.hash(password, 10);

        await pool.execute('INSERT INTO konto (email, password_hash) VALUES (?, ?)', [email, password_hash]);
        res.json({ success: true, message: 'Konto edukalt loodud!', redirectUrl: '/hspr/user/login' });
    } catch (err) {
        console.error('Error during user registration:', err);
        res.status(500).json({ success: false, error: 'Registreerumisel tekkis viga.' });
    }
};

exports.checkEmailExists = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'E-maili päringuparameeter on vajalik' });
    }

    try {
        const [rows] = await pool.execute('SELECT * FROM konto WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (err) {
        console.error('Viga e-maili kontrollimisel:', err);
        res.status(500).json({ error: 'Serveri viga' });
    }
};

exports.userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.execute('SELECT * FROM konto WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                req.session.userId = user.id;
                return res.json({ success: true, redirectUrl: '/hspr/addresults' });
            } else {
                return res.status(401).json({ success: false, error: 'Vale salasõna või kasutaja!' });
            }
        } else {
            return res.status(401).json({ success: false, error: 'Vale salasõna või kasutaja!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Viga sisselogimisel' });
    }
};

exports.userLogout = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/hspr');
        }
        res.redirect('/hspr');
    });
};

exports.userAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        res.redirect('/hspr/user/login');
    }
};