const request = require('supertest');
const User = require('../models/User');

let emailCounter = 0;

function getUniqueEmail(prefix) {
    return `${prefix}${++emailCounter}${Date.now()}@test.com`;
}

describe('AUTH MODEL - Unit Tests', () => {
    let app;

    beforeAll(async () => {
        app = global.app;
    });

    describe('User Registration - SCMS-14 Unit Tests', () => {
        test('UT-AUTH-001: Should create new user with valid data', async () => {
            const email = getUniqueEmail('testuser');
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: email,
                    password: 'ValidPass123!',
                    role: 'Developer'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe(email);
        });

        test('UT-AUTH-002: Should reject registration with short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: getUniqueEmail('shortpass'),
                    password: 'Short1!',
                    role: 'Developer'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('at least 8 characters');
        });

        test('UT-AUTH-003: Should reject duplicate email registration', async () => {
            const email = getUniqueEmail('duplicate');
            
            // First registration succeeds
            const res1 = await request(app)
                .post('/api/auth/register')
                .send({
                    email: email,
                    password: 'FirstPass123!',
                    role: 'Developer'
                });
            expect(res1.statusCode).toBe(201);

            // Second registration with same email fails
            const res2 = await request(app)
                .post('/api/auth/register')
                .send({
                    email: email,
                    password: 'SecondPass123!',
                    role: 'Manager'
                });

            expect(res2.statusCode).toBe(400);
            expect(res2.body.error).toContain('already registered');
        });

        test('UT-AUTH-004: Should reject invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'ValidPass123!',
                    role: 'Developer'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('Invalid email format');
        });

        test('UT-AUTH-005: Should create users with different roles', async () => {
            const email = getUniqueEmail('manager');
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: email,
                    password: 'ManagerPass123!',
                    role: 'Change Manager'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.user.role).toBe('Change Manager');
        });
    });

    describe('User Login - SCMS-14 Unit Tests', () => {
        let loginUserEmail;
        let loginUserPassword = 'LoginPass123!';

        beforeAll(async () => {
            // Create a fresh test user for login tests
            loginUserEmail = getUniqueEmail('login');
            const regRes = await request(app)
                .post('/api/auth/register')
                .send({
                    email: loginUserEmail,
                    password: loginUserPassword,
                    role: 'Developer'
                });
            expect(regRes.statusCode).toBe(201);
        });

        test('UT-AUTH-006: Should login with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: loginUserEmail,
                    password: loginUserPassword
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe(loginUserEmail);
        });

        test('UT-AUTH-007: Should reject login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: loginUserEmail,
                    password: 'WrongPassword123!'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('Invalid password');
        });

        test('UT-AUTH-008: Should reject login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: getUniqueEmail('nonexistent'),
                    password: 'AnyPass123!'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('User not found');
        });
    });

    describe('Field Validation - SCMS-14 Unit Tests', () => {
        test('UT-AUTH-009: Should validate email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'notanemail',
                    password: 'ValidPass123!',
                    role: 'Developer'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        test('UT-AUTH-010: Should require all mandatory fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: getUniqueEmail('missingpass')
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });
});
