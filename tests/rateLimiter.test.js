const request = require('supertest');
const app = require('../app');
const redisClient = require('../config/redisClient');
require('./setup');

describe('Login rate limiter (token bucket)', () => {
    const testEmail = 'jest-ratelimit@example.com';

    beforeEach(async () => {
        await redisClient.del(`ratelimit:login:${testEmail}`);
    });

    it('allows exactly the configured capacity under concurrent load', async () => {
        const requests = Array.from({ length: 10 }, () =>
            request(app)
                .post('/api/users/login')
                .send({ email: testEmail, password: 'wrongpassword' })
        );

        const results = await Promise.all(requests);
        const allowedCount = results.filter(r => r.status !== 429).length;

        expect(allowedCount).toBe(5); // matches your configured capacity
    });

    it('blocks further requests once capacity is exhausted', async () => {
        // drain the bucket first
        await Promise.all(Array.from({ length: 5 }, () =>
            request(app).post('/api/users/login').send({ email: testEmail, password: 'wrong' })
        ));

        const res = await request(app)
            .post('/api/users/login')
            .send({ email: testEmail, password: 'wrong' });

        expect(res.status).toBe(429);
    });
});