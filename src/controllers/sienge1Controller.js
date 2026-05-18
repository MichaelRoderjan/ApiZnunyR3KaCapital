const { Pool } = require('pg');
const redisClient = require('../Config/redisClient');

const pool = new Pool({
    host: process.env.HOST_POSTGRESQL,
    port: process.env.PORT_POSTGRESQL,
    database: process.env.DATABASE_POSTGRESQL,
    user: process.env.USER_POSTGRESQL,
    password: process.env.PASSWORD_POSTGRESQL,
});

const getContatos = async (req, res) => {
    const limit = parseInt(req.query.limit) || 0;
    const ignoreCache = req.query.ignoreCache === 'true';
    const user = req.query.user || '';

    const cacheKey = `contatos:user:${user || 'todos'}:limit:${limit || 'sem_limit'}`;

    try {
        const cache = await redisClient.get(cacheKey);

        // Só usa cache se NÃO estiver ignorando
        if (cache && !ignoreCache) {
            return res.status(200).json({
                origem: 'redis',
                dados: JSON.parse(cache),
            });
        }

        const params = [];

        let query = `
                SELECT 
                    id,name,cpf,cnpj,email,email_extra
                FROM
                    bi_r3ka_dim_clientes_completa`;

        if (user.length > 0) {
            params.push(user);
            query += ` WHERE contato.cod_tareffa = $${params.length}`;
        }

        if (limit > 0) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const result = await pool.query(query, params);

        await redisClient.setEx(
            cacheKey,
            process.env.REDIS_CACHE_EXPIRATION
            ,
            JSON.stringify(result.rows)
        );

        return res.status(200).json({
            origem: 'postgresql',
            dados: result.rows,
        });

    } catch (error) {
        console.error('Erro ao buscar contatos:', error);

        return res.status(500).json({
            error: 'Erro ao buscar contatos',
            detalhe: error.message,
        });
    }
};

module.exports = {
    getContatos,
};