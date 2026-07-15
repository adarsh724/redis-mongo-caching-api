const mongoose = require('mongoose');
const redisClient = require('../config/redisClient');

afterAll(async () => {
    await mongoose.connection.close();
    await redisClient.quit();
});