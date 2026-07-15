const request = require('supertest');
const app = require('../app');
const redisClient = require('../config/redisClient');
const User = require('../model/user-schema');
require('./setup');

describe('Auth flow', () => {
    const testUser = {
        name: 'Jest Test User',
        email: `jest-test-${Date.now()}@example.com`,
        password: 'TestPass123',
        phoneNumber: `9${Date.now().toString().slice(-9)}`,
        age:28
    };

    beforeAll(async () => {
        const keys = [];
        for await (const key of redisClient.scanIterator({ MATCH: 'ratelimit:signup:*' })) {
            keys.push(...[].concat(key));
        }
        if (keys.length > 0) await redisClient.del(keys);
    });

    afterAll(async () => {
        await User.deleteOne({ email: testUser.email });
    });

    it('creates a new user', async () => {
        const res = await request(app).post('/api/users/create').send(testUser);
        // console.log('Response body:', res.body);
        expect(res.status).toBe(201);
        expect(res.body.data).not.toHaveProperty('password');
    });

    it('rejects duplicate signup with same email', async () => {
        const res = await request(app).post('/api/users/create').send(testUser);
        expect(res.status).toBe(400);
    });

    it('logs in and returns access + refresh tokens', async () => {
        const res = await request(app).post('/api/users/login').send({
            email: testUser.email,
            password: testUser.password
        });
        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
    });

    it('rejects login with wrong password', async () => {
        const res = await request(app).post('/api/users/login').send({
            email: testUser.email,
            password: 'wrongpassword'
        });
        expect(res.status).toBe(401);
    });

    it('rejects protected route access with no token', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(401);
    });
});