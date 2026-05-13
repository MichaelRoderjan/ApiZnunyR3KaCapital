const { createClient } = require('redis');

const redisClient = createClient({
    socket: {
        host: process.env.HOST_REDIS || '127.0.0.1',
        port: process.env.PORT_REDIS || 6379,
    },
    password: process.env.PASSWORD_REDIS || '',
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