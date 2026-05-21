const { Pool } = require('pg');
const redisClient = require('../Config/redisClient');

const pool = new Pool({
    host: process.env.HOST_POSTGRESQL,
    port: Number(process.env.PORT_POSTGRESQL || 5432),
    database: process.env.DATABASE_POSTGRESQL,
    user: process.env.USER_POSTGRESQL,
    password: process.env.PASSWORD_POSTGRESQL,
});

class SiengeContatoService {
    static async listarContatos({ limit = 0, ignoreCache = false, user = '' } = {}) {
        const cacheKey = `contatos:user:${user || 'todos'}:limit:${limit || 'sem_limit'}`;

        if (!ignoreCache) {
            const cache = await redisClient.get(cacheKey);

            if (cache) {
                return {
                    origem: 'redis',
                    dados: JSON.parse(cache),
                };
            }
        }

        const params = [];

        let query = `
            SELECT
                id,
                name,
                cpf,
                cnpj,
                email,
                email_extra
            FROM
                bi_r3ka_dim_clientes_completa
        `;

        if (user.length > 0) {
            params.push(user);
            query += ` WHERE cod_tareffa = $${params.length}`;
        }

        if (limit > 0) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const result = await pool.query(query, params);

        await redisClient.setEx(
            cacheKey,
            Number(process.env.REDIS_CACHE_EXPIRATION || 3600),
            JSON.stringify(result.rows)
        );

        return {
            origem: 'postgresql',
            dados: result.rows,
        };
    }
}

module.exports = SiengeContatoService;
