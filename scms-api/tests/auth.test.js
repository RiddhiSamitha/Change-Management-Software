const request = require('supertest');
const User = require('../models/User');

// Uses the global.app set up in jest.setup.js
const app = global.app; 

describe('Auth Endpoints (SE-4, SCMS-SR-003)', () => {
    const registerUrl = '/register';
    const loginUrl = '/login';
    
    const userPayload = {
        email: 'dev@test.com',
        password: 'Password123!',
        role: 'Developer'
    };

    // Test Case 1: Successful Registration (SCMS-F-001)
    test('TC-AUTH-001: should register a new user successfully and return a JWT', async () => {
        const res = await request(app)
            .post(registerUrl)
            .send(userPayload);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toEqual(userPayload.email);

        const userCount = await User.countDocuments({ email: userPayload.email });
        expect(userCount).toBe(1); // User created in DB
    });

    // Test Case 2: Registration with Invalid Password (SCMS-SR-003 constraint)
    test('TC-AUTH-002: should block registration if password is too short', async () => {
        const res = await request(app)
            .post(registerUrl)
            .send({ ...userPayload, password: 'short' }); // Less than 8 chars

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Password must be at least 8 characters');
    });

    // Test Case 3: Registration with duplicate email
    test('TC-AUTH-003: should block registration if email is already used', async () => {
        // First successful registration
        await request(app).post(registerUrl).send(userPayload);

        // Second registration attempt
        const res = await request(app)
            .post(registerUrl)
            .send(userPayload);

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Email already registered');
    });
    
    // Test Case 4: Successful Login (SE-6)
    test('TC-AUTH-004: should login a registered user successfully and return a token/user object', async () => {
        // Register the user first
        await request(app).post(registerUrl).send(userPayload);

        const res = await request(app)
            .post(loginUrl)
            .send({ email: userPayload.email, password: userPayload.password });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('role', userPayload.role);
    });

    // Test Case 5: Login with Invalid Password (SE-6 failure)
    test('TC-AUTH-005: should return 400 for invalid password on login', async () => {
        await request(app).post(registerUrl).send(userPayload);

        const res = await request(app)
            .post(loginUrl)
            .send({ email: userPayload.email, password: 'wrongpassword' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Invalid email or password');
    });

    // Test Case 6: Login with unregistered email (SE-6 failure)
    test('TC-AUTH-006: should return 400 for unregistered email on login', async () => {
        const res = await request(app)
            .post(loginUrl)
            .send({ email: 'unknown@test.com', password: userPayload.password });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Invalid email or password');
    });
});