const request = require('supertest');

let emailCounter = 0;
function uniqueEmail(prefix) {
    return `${prefix}${++emailCounter}${Date.now()}@test.com`;
}

describe('CHANGE REQUESTS - Negative / Edge Path Tests', () => {
    let app;

    beforeAll(async () => {
        app = global.app;
    });

    async function registerAndLogin(rolePrefix, role) {
        const email = uniqueEmail(rolePrefix);
        const password = 'TestPass123!';
        const reg = await request(app)
            .post('/api/auth/register')
            .send({ email, password, role });
        expect(reg.statusCode).toBe(201);

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email, password });
        expect(login.statusCode).toBe(200);
        return { token: login.body.token, user: login.body.user };
    }

    test('NR-001: GET non-existent CR returns 404', async () => {
        const { token } = await registerAndLogin('nonexist', 'Developer');
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await request(app)
            .get(`/api/change-requests/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
    });

    test('NR-002: Developer cannot view another user\'s CR (403)', async () => {
        const creator = await registerAndLogin('creator', 'Developer');
        const other = await registerAndLogin('otherdev', 'Developer');

        // Creator makes a CR
        const createRes = await request(app)
            .post('/api/change-requests')
            .set('Authorization', `Bearer ${creator.token}`)
            .send({
                title: 'A valid title for a CR',
                description: 'A sufficiently long description for the change request.',
                category: 'Normal'
            });
        expect(createRes.statusCode).toBe(201);
        const crId = createRes.body._id || createRes.body.id;

        // Other developer attempts to GET
        const res = await request(app)
            .get(`/api/change-requests/${crId}`)
            .set('Authorization', `Bearer ${other.token}`);

        expect(res.statusCode).toBe(403);
    });

    test('NR-003: Approve by non-approver returns 403', async () => {
        const creator = await registerAndLogin('c2', 'Developer');

        // Create and submit CR
        const createRes = await request(app)
            .post('/api/change-requests')
            .set('Authorization', `Bearer ${creator.token}`)
            .send({
                title: 'Another valid CR title',
                description: 'Even longer description to satisfy the min length requirement for tests.',
                category: 'Normal'
            });
        expect(createRes.statusCode).toBe(201);
        const crId = createRes.body._id || createRes.body.id;

        const submitRes = await request(app)
            .put(`/api/change-requests/${crId}/submit`)
            .set('Authorization', `Bearer ${creator.token}`);
        expect(submitRes.statusCode).toBe(200);

        // Creator (Developer) tries to approve -> should be forbidden
        const approveRes = await request(app)
            .put(`/api/change-requests/${crId}/approve`)
            .set('Authorization', `Bearer ${creator.token}`)
            .send({ comment: 'Approving as creator (should fail)' });

        expect(approveRes.statusCode).toBe(403);
    });

    test('NR-004: Rejecting a Draft CR returns 400 (even by approver)', async () => {
        const creator = await registerAndLogin('c3', 'Developer');
        const approver = await registerAndLogin('appr', 'Change Manager');

        // Create CR but do not submit
        const createRes = await request(app)
            .post('/api/change-requests')
            .set('Authorization', `Bearer ${creator.token}`)
            .send({
                title: 'Draft CR to test reject',
                description: 'This description is long enough to pass validation for a draft CR.',
                category: 'Normal'
            });
        expect(createRes.statusCode).toBe(201);
        const crId = createRes.body._id || createRes.body.id;

        // Approver tries to reject while status is Draft
        const rej = await request(app)
            .put(`/api/change-requests/${crId}/reject`)
            .set('Authorization', `Bearer ${approver.token}`)
            .send({ reason: 'Not applicable' });

        expect(rej.statusCode).toBe(400);
    });

    test('NR-005: Delete by non-creator returns 403', async () => {
        const creator = await registerAndLogin('c4', 'Developer');
        const other = await registerAndLogin('c4other', 'Developer');

        const createRes = await request(app)
            .post('/api/change-requests')
            .set('Authorization', `Bearer ${creator.token}`)
            .send({
                title: 'CR To Be Protected',
                description: 'Protect this CR from other users trying to delete it.',
                category: 'Normal'
            });
        expect(createRes.statusCode).toBe(201);
        const crId = createRes.body._id || createRes.body.id;

        const del = await request(app)
            .delete(`/api/change-requests/${crId}`)
            .set('Authorization', `Bearer ${other.token}`);

        expect(del.statusCode).toBe(403);
    });

    test('NR-006: Update by non-creator returns 403', async () => {
        const creator = await registerAndLogin('c5', 'Developer');
        const other = await registerAndLogin('c5other', 'Developer');

        const createRes = await request(app)
            .post('/api/change-requests')
            .set('Authorization', `Bearer ${creator.token}`)
            .send({
                title: 'CR for update test',
                description: 'Will try to update this CR by another user (should fail).',
                category: 'Normal'
            });
        expect(createRes.statusCode).toBe(201);
        const crId = createRes.body._id || createRes.body.id;

        const upd = await request(app)
            .put(`/api/change-requests/${crId}`)
            .set('Authorization', `Bearer ${other.token}`)
            .send({ title: 'Malicious update attempt' });

        expect(upd.statusCode).toBe(403);
    });

    test('NR-007: POST invalid payload triggers ValidationError (400)', async () => {
        const user = await registerAndLogin('c6', 'Developer');

        // Short title and missing description should fail validation
        const res = await request(app)
            .post('/api/change-requests')
            .set('Authorization', `Bearer ${user.token}`)
            .send({
                title: 'short',
                category: 'Normal'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error || res.body.message).toBeDefined();
    });
});
