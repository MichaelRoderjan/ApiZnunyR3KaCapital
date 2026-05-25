const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.HOST_POSTGRESQL,
    port: Number(process.env.PORT_POSTGRESQL || 5432),
    database: process.env.DATABASE_POSTGRESQL,
    user: process.env.USER_POSTGRESQL,
    password: process.env.PASSWORD_POSTGRESQL,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
