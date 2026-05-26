const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.HOST_POSTGRESQLCAPITAL,
    port: Number(process.env.PORT_POSTGRESQLCAPITAL || 5432),
    database: process.env.DATABASE_POSTGRESQLCAPITAL,
    user: process.env.USER_POSTGRESQLCAPITAL,
    password: process.env.PASSWORD_POSTGRESQLCAPITAL,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
