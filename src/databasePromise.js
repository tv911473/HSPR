const mysql = require('mysql2/promise');
const dbConfig = require('../../dbConfig');
const pool = mysql.createPool({
    host: dbConfig.configData.host,
    user: dbConfig.configData.user,
    password: dbConfig.configData.password,
    database: dbConfig.configData.database,
    connectionLimit: 10 
});

module.exports = pool;
