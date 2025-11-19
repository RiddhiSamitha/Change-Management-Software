const request = require('supertest');
const User = require('../models/User');
const ChangeRequest = require('../models/ChangeRequest');

describe('SYSTEM INTEGRATION TESTS - End-to-End Workflows', () => {
    let app;
    let developerToken;
    let reviewerToken;
    let adminToken;
    let developerUser;
    let reviewerUser;
    let adminUser;
    let createdCRId;

    beforeAll(async () => {
        app = global.app;

        // Create test users with different roles
        const devRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'system-dev@test.com',
                password: 'SystemDev123!',
                role: 'Developer'
            });
        developerToken = devRes.body.token;
        developerUser = devRes.body.user;

        const revRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'system-reviewer@test.com',
                password: 'SystemReviewer123!',
                role: 'Technical Lead'
            });
        reviewerToken = revRes.body.token;
        reviewerUser = revRes.body.user;

        const adminRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'system-admin@test.com',
                password: 'SystemAdmin123!',
                role: 'System Administrator'
            });
        adminToken = adminRes.body.token;
        adminUser = adminRes.body.user;
    });

    describe('ST-001: Complete CR Lifecycle - Draft to Approved', () => {
        test('ST-001-A: Developer creates a CR in Draft status', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'System Test CR - Database Migration',
                    description: 'Comprehensive system test for complete CR lifecycle workflow validation',
                    category: 'Normal',
                    priority: 'High',
                    impact_scope: 'System',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('Draft');
            expect(res.body.cr_number).toMatch(/^CR-\d{4}-\d+$/);
            expect(res.body.createdBy._id).toBe(developerUser.id);
            
            createdCRId = res.body._id;
        });

        test('ST-001-B: Developer can view their own Draft CR', async () => {
            const res = await request(app)
                .get(`/api/change-requests/${createdCRId}`)
                .set('Authorization', `Bearer ${developerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.changeRequest.status).toBe('Draft');
            expect(res.body.changeRequest._id).toBe(createdCRId);
        });

        test('ST-001-C: Developer edits the Draft CR', async () => {
            const res = await request(app)
                .put(`/api/change-requests/${createdCRId}`)
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'System Test CR - Database Migration (UPDATED)',
                    description: 'Updated description with more comprehensive system test coverage information',
                    priority: 'Critical'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toContain('UPDATED');
            expect(res.body.priority).toBe('Critical');
        });

        test('ST-001-D: Developer submits CR for approval (Draft → Pending)', async () => {
            const res = await request(app)
                .put(`/api/change-requests/${createdCRId}/submit`)
                .set('Authorization', `Bearer ${developerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('Pending');
            expect(res.body.submittedBy).toBeDefined();
            expect(res.body.submittedAt).toBeDefined();
        });

        test('ST-001-E: Reviewer approves CR with empty comment (comment is optional)', async () => {
            const res = await request(app)
                .put(`/api/change-requests/${createdCRId}/approve`)
                .set('Authorization', `Bearer ${reviewerToken}`)
                .send({
                    comment: ''
                });

            // Approve should succeed even with empty comment
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('Approved');
        });

        test('ST-001-F: Reviewer approves the CR (Pending → Approved)', async () => {
            // Create a new CR to test proper approval with comment
            const newCRRes = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'System Test CR - Approval with Comment',
                    description: 'Comprehensive system test for CR approval with reviewer comments validation',
                    category: 'Normal',
                    priority: 'High',
                    impact_scope: 'System',
                    attachments: []
                });

            const newCRId = newCRRes.body._id;

            // Submit the CR
            await request(app)
                .put(`/api/change-requests/${newCRId}/submit`)
                .set('Authorization', `Bearer ${developerToken}`);

            // Approve with comment
            const res = await request(app)
                .put(`/api/change-requests/${newCRId}/approve`)
                .set('Authorization', `Bearer ${reviewerToken}`)
                .send({
                    comment: 'Approved after comprehensive system testing and validation'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('Approved');
            expect(res.body.approvedBy).toBeDefined();
        });

        test('ST-001-G: CR cannot be edited after approval', async () => {
            const res = await request(app)
                .put(`/api/change-requests/${createdCRId}`)
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'This should fail'
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('already under review');
        });
    });

    describe('ST-002: Complete CR Lifecycle - Draft to Rejected', () => {
        let rejectionCRId;

        test('ST-002-A: Create and submit CR for rejection scenario', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'System Test CR - Rejection Scenario Testing',
                    description: 'Comprehensive system testing for rejection workflow and status transitions',
                    category: 'Emergency',
                    priority: 'Low',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(201);
            rejectionCRId = res.body._id;

            // Submit for approval
            const submitRes = await request(app)
                .put(`/api/change-requests/${rejectionCRId}/submit`)
                .set('Authorization', `Bearer ${developerToken}`);

            expect(submitRes.statusCode).toBe(200);
        });

        test('ST-002-B: Reviewer rejects the CR (Pending → Rejected)', async () => {
            const res = await request(app)
                .put(`/api/change-requests/${rejectionCRId}/reject`)
                .set('Authorization', `Bearer ${reviewerToken}`)
                .send({
                    reason: 'Does not meet business requirements for current sprint'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('Rejected');
            expect(res.body.rejectionReason).toContain('business requirements');
        });

        test('ST-002-C: Rejected CR is not visible to other reviewers in pending list', async () => {
            const res = await request(app)
                .get('/api/change-requests')
                .set('Authorization', `Bearer ${reviewerToken}`);

            expect(res.statusCode).toBe(200);
            const isInList = res.body.changeRequests.some(cr => cr._id === rejectionCRId && cr.status === 'Pending');
            expect(isInList).toBe(false);
        });
    });

    describe('ST-003: Developer View Restrictions', () => {
        let otherDevCRId;

        test('ST-003-A: Developer cannot view other developer CRs in Draft status', async () => {
            // Create another developer account
            const otherDevRes = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'other-dev@test.com',
                    password: 'OtherDev123!',
                    role: 'Developer'
                });
            const otherDevToken = otherDevRes.body.token;

            // Create a CR with the other developer
            const crRes = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${otherDevToken}`)
                .send({
                    title: 'Other Developer CR - Draft Status Test',
                    description: 'System testing developer access control and data isolation verification',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Unit',
                    attachments: []
                });

            otherDevCRId = crRes.body._id;

            // First developer tries to view it
            const viewRes = await request(app)
                .get(`/api/change-requests/${otherDevCRId}`)
                .set('Authorization', `Bearer ${developerToken}`);

            expect(viewRes.statusCode).toBe(403);
        });

        test('ST-003-B: Reviewer can view CR from any developer', async () => {
            // Submit the other dev's CR first
            const otherDevRes = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'other-dev2@test.com',
                    password: 'OtherDev123!',
                    role: 'Developer'
                });
            const otherDevToken = otherDevRes.body.token;

            const crRes = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${otherDevToken}`)
                .send({
                    title: 'Another CR for Reviewer Test',
                    description: 'System testing reviewer access to all non-draft change requests',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'System',
                    attachments: []
                });

            const crId = crRes.body._id;

            // Submit it
            await request(app)
                .put(`/api/change-requests/${crId}/submit`)
                .set('Authorization', `Bearer ${otherDevToken}`);

            // Reviewer views it
            const viewRes = await request(app)
                .get(`/api/change-requests/${crId}`)
                .set('Authorization', `Bearer ${reviewerToken}`);

            expect(viewRes.statusCode).toBe(200);
        });
    });

    describe('ST-004: Admin Dashboard Statistics', () => {
        test('ST-004-A: Admin can fetch system statistics', async () => {
            const res = await request(app)
                .get('/api/admin/statistics')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.users).toBeDefined();
            expect(res.body.users.total).toBeGreaterThan(0);
            expect(res.body.changeRequests).toBeDefined();
            expect(res.body.changeRequests.total).toBeGreaterThan(0);
        });

        test('ST-004-B: Admin statistics show users by role', async () => {
            const res = await request(app)
                .get('/api/admin/statistics')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.users.byRole)).toBe(true);
            const hasRole = res.body.users.byRole.some(r => r._id === 'Developer');
            expect(hasRole).toBe(true);
        });

        test('ST-004-C: Admin statistics show CRs by status', async () => {
            const res = await request(app)
                .get('/api/admin/statistics')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.changeRequests.byStatus)).toBe(true);
            expect(res.body.changeRequests.byStatus.length).toBeGreaterThan(0);
        });
    });

    describe('ST-005: Admin User Management', () => {
        let newUserId;

        test('ST-005-A: Admin can create new users', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'new-user@test.com',
                    password: 'NewUser123!',
                    role: 'QA Engineer'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.user.email).toBe('new-user@test.com');
            expect(res.body.user.role).toBe('QA Engineer');
            newUserId = res.body.user._id;
        });

        test('ST-005-B: Admin can fetch all users', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(res.body.users.length).toBeGreaterThan(0);
            expect(res.body.users[0]).not.toHaveProperty('password');
        });

        test('ST-005-C: Admin can update user role', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${newUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'Release Manager'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.role).toBe('Release Manager');
        });

        test('ST-005-D: Admin cannot delete their own account', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('cannot delete your own account');
        });

        test('ST-005-E: Admin can delete other users', async () => {
            // Create a user to delete
            const createRes = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'delete-me@test.com',
                    password: 'DeleteMe123!',
                    role: 'Auditor'
                });

            const userId = createRes.body.user._id;

            // Delete the user
            const deleteRes = await request(app)
                .delete(`/api/admin/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteRes.statusCode).toBe(200);
        });
    });

    describe('ST-006: Role-Based Access Control', () => {
        test('ST-006-A: Non-admin cannot access admin statistics', async () => {
            const res = await request(app)
                .get('/api/admin/statistics')
                .set('Authorization', `Bearer ${developerToken}`);

            expect(res.statusCode).toBe(403);
        });

        test('ST-006-B: Non-admin cannot create users', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    email: 'unauthorized@test.com',
                    password: 'Unauthorized123!',
                    role: 'Developer'
                });

            expect(res.statusCode).toBe(403);
        });

        test('ST-006-C: Developer cannot approve CRs', async () => {
            // Create a CR and submit it
            const crRes = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'CR for Approval Permission Test',
                    description: 'System testing role-based approval permissions and access control',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            const crId = crRes.body._id;

            await request(app)
                .put(`/api/change-requests/${crId}/submit`)
                .set('Authorization', `Bearer ${developerToken}`);

            // Developer tries to approve (should fail)
            const approveRes = await request(app)
                .put(`/api/change-requests/${crId}/approve`)
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    comment: 'Attempting unauthorized approval'
                });

            expect(approveRes.statusCode).toBe(403);
        });
    });

    describe('ST-007: Authentication and Authorization', () => {
        test('ST-007-A: Unauthenticated request is rejected', async () => {
            const res = await request(app)
                .get('/api/change-requests');

            expect(res.statusCode).toBe(401);
        });

        test('ST-007-B: Invalid token is rejected', async () => {
            const res = await request(app)
                .get('/api/change-requests')
                .set('Authorization', 'Bearer invalid-token-xyz');

            expect(res.statusCode).toBe(401);
        });

        test('ST-007-C: User can login and get valid token', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'system-dev@test.com',
                    password: 'SystemDev123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe('system-dev@test.com');
        });

        test('ST-007-D: Wrong password returns 400', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'system-dev@test.com',
                    password: 'WrongPassword123!'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('Invalid password');
        });
    });

    describe('ST-008: Data Integrity and Constraints', () => {
        test('ST-008-A: Duplicate email registration fails', async () => {
            const email = 'duplicate-test@test.com';

            // First registration
            const res1 = await request(app)
                .post('/api/auth/register')
                .send({
                    email: email,
                    password: 'FirstPass123!',
                    role: 'Developer'
                });

            expect(res1.statusCode).toBe(201);

            // Duplicate registration
            const res2 = await request(app)
                .post('/api/auth/register')
                .send({
                    email: email,
                    password: 'SecondPass123!',
                    role: 'Developer'
                });

            expect(res2.statusCode).toBe(400);
            expect(res2.body.error).toContain('already registered');
        });

        test('ST-008-B: CR numbers are unique', async () => {
            const cr1Res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'First CR for Uniqueness Test System Implementation',
                    description: 'Comprehensive system testing for unique CR number generation and validation',
                    category: 'Normal',
                    priority: 'Low',
                    impact_scope: 'Unit',
                    attachments: []
                });

            const cr2Res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'Second CR for Uniqueness Test System Implementation',
                    description: 'Comprehensive system testing for unique CR number generation and validation',
                    category: 'Standard',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(cr1Res.statusCode).toBe(201);
            expect(cr2Res.statusCode).toBe(201);
            expect(cr1Res.body.cr_number).not.toBe(cr2Res.body.cr_number);
        });

        test('ST-008-C: CR field validation enforces constraints', async () => {
            const res = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'Short',
                    description: 'Short',
                    category: 'Normal',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('ST-009: Multiple CRs and Filtering', () => {
        test('ST-009-A: Developer sees only their CRs', async () => {
            const res = await request(app)
                .get('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.changeRequests)).toBe(true);

            // All CRs should be created by this developer
            const allByDev = res.body.changeRequests.every(
                cr => cr.createdBy._id === developerUser.id
            );
            expect(allByDev).toBe(true);
        });

        test('ST-009-B: Reviewer sees all non-draft CRs', async () => {
            const res = await request(app)
                .get('/api/change-requests')
                .set('Authorization', `Bearer ${reviewerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.changeRequests)).toBe(true);

            // No Draft CRs should be visible
            const noDrafts = res.body.changeRequests.every(cr => cr.status !== 'Draft');
            expect(noDrafts).toBe(true);
        });

        test('ST-009-C: Admin sees all CRs', async () => {
            const res = await request(app)
                .get('/api/admin/change-requests')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.changeRequests)).toBe(true);
            expect(res.body.changeRequests.length).toBeGreaterThan(0);
        });
    });

    describe('ST-010: Workflow State Transitions', () => {
        test('ST-010-A: Cannot transition from Draft directly to Approved', async () => {
            // This is tested implicitly - you must submit first
            // Create a CR in draft
            const crRes = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'CR for State Transition Testing System Implementation',
                    description: 'Comprehensive system testing workflow state transition validation',
                    category: 'Normal',
                    priority: 'High',
                    impact_scope: 'System',
                    attachments: []
                });

            const crId = crRes.body._id;

            // Try to approve without submitting
            const approveRes = await request(app)
                .put(`/api/change-requests/${crId}/approve`)
                .set('Authorization', `Bearer ${reviewerToken}`)
                .send({
                    comment: 'This should fail'
                });

            expect(approveRes.statusCode).toBe(400);
        });

        test('ST-010-B: Cannot submit an already submitted CR', async () => {
            const crRes = await request(app)
                .post('/api/change-requests')
                .set('Authorization', `Bearer ${developerToken}`)
                .send({
                    title: 'CR for Double Submit Test System Implementation',
                    description: 'Comprehensive system testing double submission prevention workflow',
                    category: 'Standard',
                    priority: 'Medium',
                    impact_scope: 'Module',
                    attachments: []
                });

            const crId = crRes.body._id;

            // Submit first time
            const submit1 = await request(app)
                .put(`/api/change-requests/${crId}/submit`)
                .set('Authorization', `Bearer ${developerToken}`);

            expect(submit1.statusCode).toBe(200);

            // Try to submit again
            const submit2 = await request(app)
                .put(`/api/change-requests/${crId}/submit`)
                .set('Authorization', `Bearer ${developerToken}`);

            expect(submit2.statusCode).toBe(400);
            expect(submit2.body.message).toContain('already been submitted');
        });
    });
});
