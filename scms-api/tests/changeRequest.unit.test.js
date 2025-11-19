const request = require('supertest');
const ChangeRequest = require('../models/ChangeRequest');
const User = require('../models/User');

describe('CHANGE REQUEST MODEL - Unit Tests', () => {
    let app;
    let devToken;
    let devUser;

    beforeAll(async () => {
        app = global.app;

        // Register a developer for CR tests
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'crdev@test.com',
                password: 'Password123!',
                role: 'Developer'
            });

        devToken = regRes.body.token;
        devUser = regRes.body.user;
    });

    describe('CR Creation - SCMS-14 Unit Tests', () => {
        test('UT-CR-001: Should create CR with valid data', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Unit Test CR Title - Valid Data',
                    description: 'This is a comprehensive description for testing',
                    category: 'Normal',
                    priority: 'High',
                    impact_scope: 'System',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('Draft');
            expect(res.body.title).toBe('Unit Test CR Title - Valid Data');
        });

        test('UT-CR-002: Should initialize CR as Draft', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Another Unit Test CR - Status Check',
                    description: 'Testing initial draft status assignment',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('Draft');
        });

        test('UT-CR-003: Should reject CR without authentication', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .send({
                    title: 'Unauth CR',
                    description: 'This should fail',
                    category: 'Normal',
                    priority: 'Low',
                    impact_scope: 'Unit',
                    attachments: []
                });

            expect(res.statusCode).toBe(401);
        });

        test('UT-CR-004: Should reject CR with missing title', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    description: 'Missing title test',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(400);
        });

        test('UT-CR-005: Should reject short title', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Short',
                    description: 'This description is long enough for validation',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(400);
        });

        test('UT-CR-006: Should reject short description', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Valid Title For Testing Unit Cases',
                    description: 'Short',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(400);
        });

        test('UT-CR-007: Should auto-generate unique CR number', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'CR Number Generation Test Case',
                    description: 'Testing automatic CR number generation functionality',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.cr_number).toBeDefined();
            expect(res.body.cr_number).toMatch(/^CR-\d{4}-\d+$/);
        });
    });

    describe('CR Validation - SCMS-14 Unit Tests', () => {
        test('UT-CR-008: Should accept valid priority values', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Priority Validation Test Case Implementation',
                    description: 'Testing various priority level validations and acceptance',
                    category: 'Normal',
                    priority: 'Critical',
                    impact_scope: 'System',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.priority).toBe('Critical');
        });

        test('UT-CR-009: Should accept valid status enum', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Status Enum Validation Test Implementation',
                    description: 'Testing status enumeration value validation and storage',
                    category: 'Standard',
                    priority: 'High',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(['Draft', 'Pending', 'Approved', 'Rejected']).toContain(res.body.status);
        });

        test('UT-CR-010: Should accept valid category values', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Category Values Validation Test Implementation',
                    description: 'Testing category field validation with various valid values',
                    category: 'Emergency',
                    priority: 'Medium',
                    impact_scope: 'System',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(['Normal', 'Standard', 'Emergency']).toContain(res.body.category);
        });

        test('UT-CR-011: Should track creation timestamp', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Timestamp Tracking Implementation Test Case',
                    description: 'Validating creation timestamp is properly recorded and stored',
                    category: 'Normal',
                    priority: 'Low',
                    impact_scope: 'Unit',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.createdAt).toBeDefined();
        });

        test('UT-CR-012: Should initialize CR status as Draft', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    title: 'Initial Draft Status Test Case Implementation',
                    description: 'Verifying new CR always starts with Draft status value',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('Draft');
        });
    });
});
