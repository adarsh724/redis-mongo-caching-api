const {createClient} = require('redis');

const redisClient = createClient({
    url: process.env.Redis_URI || 'redis://localhost:6379'
});

redisClient.on('error',(err)=>console.error('Redis error: ',err));

(async () => {
    await redisClient.connect();
})();

module.exports = redisClient;