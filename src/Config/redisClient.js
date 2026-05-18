const { createClient } = require('redis');

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
    },
    password: process.env.REDIS_PASSWORD || '',
});

redisClient.on('connect', () => {
    console.log('Redis conectado');
})

redisClient.on('error', (err) => {
    console.error('Erro no Redis:', err);
});

(async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
})();

module.exports = redisClient;