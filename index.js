const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const session = require("express-session");
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');

const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: secret || 'H5PR_di5cM4ster_s3cret_Key',
    resave: false,
    saveUninitialized: false,
}));

app.use((req, res, next) => {
    res.locals.user = req.session.userId ? { id: req.session.userId } : null;
    next();
});

app.use('/hspr/api', apiRoutes);
app.use('/hspr', viewRoutes);

const PORT = process.env.PORT || 5126;
app.listen(PORT, () => {
});
