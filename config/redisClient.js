const {createClient} = require('redis');

const redisClient = createClient({
    url: process.env.Redis_URI
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

(async () => {
    await redisClient.connect();
})();

module.exports = redisClient;