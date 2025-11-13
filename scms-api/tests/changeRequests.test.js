const request = require('supertest');
const jwt = require('jsonwebtoken');
const ChangeRequest = require('../models/ChangeRequest');
const User = require('../models/User');

// Uses the global.app set up in jest.setup.js
const app = global.app; 

const CR_API_URL = '/api/change-requests';
const JWT_SECRET = 'a_very_secret_key_for_scms_jwt_12345'; // Matches .env for consistency

// Helper function to create a token for a given user role
const generateToken = (userId, role = 'Developer', email = 'test@user.com') => {
    const payload = { user: { id: userId, role, email } };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

let developerToken, managerToken;
let developerUser, managerUser;

const crPayload = {
    title: 'Minimum 10 characters long title for testing',
    description: 'A detailed description of the change at least 20 characters long.',
    category: 'Normal',
    priority: 'Medium',
    impact_scope: 'Frontend, Authentication',
    attachments: 'http://link.to/document'
};

// Setup users and tokens before running CR tests
beforeAll(async () => {
    // Create Developer User
    developerUser = await User.create({ email: 'developer@test.com', password: 'Password123!', role: 'Developer' });
    developerToken = generateToken(developerUser._id, 'Developer');
    
    // Create Change Manager User
    managerUser = await User.create({ email: 'manager@test.com', password: 'Password123!', role: 'Change Manager' });
    managerToken = generateToken(managerUser._id, 'Change Manager');
});

describe('Change Request Endpoints (SCMS-F-001, SCMS-F-002, SE-8, SE-9)', () => {

    // Test Case 7: Developer Submits a CR (SE-8, SCMS-F-001)
    test('TC-CR-007: Developer should successfully submit a CR in Draft status', async () => {
        const res = await request(app)
            .post(CR_API_URL)
            .set('Authorization', `Bearer ${developerToken}`)
            .send(crPayload);

        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual(crPayload.title);
        expect(res.body.status).toEqual('Draft'); // AC: Saved with status Draft
        expect(res.body.createdBy.toString()).toEqual(developerUser._id.toString());
        expect(res.body.attachments.length).toEqual(1);
    });
    
    // Test Case 8: CR Number Generation (SCMS-F-002)
    test('TC-CR-008: Submitted CR should have a unique CR-YYYY-NNNN format', async () => {
        // Submit first CR
        await request(app)
            .post(CR_API_URL)
            .set('Authorization', `Bearer ${developerToken}`)
            .send(crPayload);
        
        // Submit second CR
        const res2 = await request(app)
            .post(CR_API_URL)
            .set('Authorization', `Bearer ${developerToken}`)
            .send(crPayload);
            
        const year = new Date().getFullYear();
        // Expect CR-YYYY-0002
        expect(res2.body.cr_number).toMatch(new RegExp(`^CR-${year}-\\d{4}$`));

        // Check if the number is incremented correctly (e.g., CR-2025-0002)
        const numPart = parseInt(res2.body.cr_number.split('-')[2], 10);
        expect(numPart).toBeGreaterThanOrEqual(2); 
    });

    // Test Case 9: Submission with missing required fields (SCMS-F-001 failure)
    test('TC-CR-009: should block CR submission with missing title', async () => {
        const invalidPayload = { ...crPayload, title: '' };
        const res = await request(app)
            .post(CR_API_URL)
            .set('Authorization', `Bearer ${developerToken}`)
            .send(invalidPayload);

        // Expect validation to catch this, although the frontend also checks it.
        // The backend validation here is implicit via Mongoose schema required field.
        expect(res.statusCode).toBe(500); // Mongoose error from required field
    });
    
    // Test Case 10: Unauthorized CR Submission (SCMS-SR-006)
    test('TC-CR-010: should block CR submission without a token', async () => {
        const res = await request(app)
            .post(CR_API_URL)
            .send(crPayload);

        expect(res.statusCode).toEqual(401); // Unauthorized
    });
    
    // Test Case 11: Developer views only their own CRs (SE-9 logic)
    test('TC-CR-011: Developer should only see their own Change Requests', async () => {
        // Create CRs for both users
        await ChangeRequest.create({ ...crPayload, createdBy: developerUser._id, cr_number: 'CR-9999-0001' });
        await ChangeRequest.create({ ...crPayload, createdBy: managerUser._id, cr_number: 'CR-9999-0002' });

        const res = await request(app)
            .get(CR_API_URL)
            .set('Authorization', `Bearer ${developerToken}`);
        
        expect(res.statusCode).toEqual(200);
        const crs = res.body.changeRequests;
        // Developer should only see the one they created
        expect(crs.length).toEqual(1); 
        expect(crs[0].createdBy.toString()).toEqual(developerUser._id.toString());
    });
    
    // Test Case 12: Manager views all CRs (SE-9 logic)
    test('TC-CR-012: Change Manager should see all Change Requests', async () => {
        // 1. Clear CRs and create distinct CRs for dev and manager
        await ChangeRequest.deleteMany({});
        await ChangeRequest.create({ ...crPayload, createdBy: developerUser._id, cr_number: 'CR-9999-0003' });
        await ChangeRequest.create({ ...crPayload, createdBy: managerUser._id, cr_number: 'CR-9999-0004' });

        const res = await request(app)
            .get(CR_API_URL)
            .set('Authorization', `Bearer ${managerToken}`);
        
        expect(res.statusCode).toEqual(200);
        const crs = res.body.changeRequests;
        // Manager should see both CRs
        expect(crs.length).toEqual(2); 
    });

    // Test Case 13: Attempt to update a CR without right role (SCMS-SR-007)
    test('TC-CR-013: Unauthorized user (Manager) cannot access Developer-only route', async () => {
        // The POST route is protected by roleAuth(['Developer'])
        const res = await request(app)
            .post(CR_API_URL)
            .set('Authorization', `Bearer ${managerToken}`)
            .send(crPayload);

        expect(res.statusCode).toEqual(403); // Forbidden
        expect(res.body.message).toEqual('Forbidden: Your role does not have permission for this action.');
    });
});

describe('Change Request PUT/DELETE Endpoints (Owner/Draft Checks)', () => {
    let crId;
    let otherDevToken;

    beforeEach(async () => {
        // Reset and create a new CR by the main developer
        await ChangeRequest.deleteMany({});
        const res = await request(app)
            .post(CR_API_URL)
            .set('Authorization', `Bearer ${developerToken}`)
            .send(crPayload);
        crId = res.body._id;

        // Create a different developer user for forbidden tests
        const otherDevUser = await User.create({ email: 'otherdev@test.com', password: 'Password123!', role: 'Developer' });
        otherDevToken = generateToken(otherDevUser._id, 'Developer');
    });

    // Test Case 14: Developer Updates their own Draft CR (SCMS-F-001 update)
    test('TC-CR-014: CR creator can update their own Draft CR', async () => {
        const updatePayload = { title: 'Updated title for CR' };

        const res = await request(app)
            .put(`${CR_API_URL}/${crId}`)
            .set('Authorization', `Bearer ${developerToken}`)
            .send(updatePayload);

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toEqual(updatePayload.title);
    });

    // Test Case 15: Developer Cannot Update another user's Draft CR (SCMS-SR-007)
    test('TC-CR-015: CR non-creator cannot update the Draft CR', async () => {
        const updatePayload = { title: 'Attempt to hijack CR' };

        const res = await request(app)
            .put(`${CR_API_URL}/${crId}`)
            .set('Authorization', `Bearer ${otherDevToken}`)
            .send(updatePayload);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toEqual('Forbidden: You are not the creator of this CR.');
    });

    // Test Case 16: Developer Deletes their own Draft CR
    test('TC-CR-016: CR creator can delete their own Draft CR', async () => {
        const res = await request(app)
            .delete(`${CR_API_URL}/${crId}`)
            .set('Authorization', `Bearer ${developerToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('CR deleted successfully');

        const deletedCr = await ChangeRequest.findById(crId);
        expect(deletedCr).toBeNull();
    });

    // Test Case 17: Developer Cannot Delete a CR with status other than Draft
    test('TC-CR-017: CR cannot be deleted if its status is not Draft', async () => {
        // Update CR status to Pending
        await ChangeRequest.findByIdAndUpdate(crId, { status: 'Pending' });

        const res = await request(app)
            .delete(`${CR_API_URL}/${crId}`)
            .set('Authorization', `Bearer ${developerToken}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toEqual('Forbidden: Cannot delete a CR that is already under review.');
    });
});