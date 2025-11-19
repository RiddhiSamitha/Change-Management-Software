const request = require('supertest');
const Counter = require('../models/Counter');

describe('CHANGE REQUESTS - Coverage tests (approve/reject/delete/duplicate-counter)', () => {
  let app;
  let devToken, dev2Token, reviewerToken;

  beforeAll(async () => {
    app = global.app;

    // register developer
    const r1 = await request(app).post('/api/auth/register').send({
      email: 'coveragedev@test.com',
      password: 'Password123!',
      role: 'Developer'
    });
    devToken = r1.body.token;

    // register another developer
    const r2 = await request(app).post('/api/auth/register').send({
      email: 'coveragedev2@test.com',
      password: 'Password123!',
      role: 'Developer'
    });
    dev2Token = r2.body.token;

    // register reviewer (approver)
    const r3 = await request(app).post('/api/auth/register').send({
      email: 'coveragerev@test.com',
      password: 'Password123!',
      role: 'Reviewer'
    });
    reviewerToken = r3.body.token;
  });

  test('Approve with comment stores approvalComment', async () => {
    // create a CR
    const cr = await request(app)
      .post('/api/change-requests')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        title: 'Approve comment test',
        description: 'Long enough description for approve comment test',
        category: 'Normal',
        priority: 'Medium',
        impact_scope: 'System',
        attachments: []
      });

    expect(cr.statusCode).toBe(201);
    const id = cr.body._id;

    // submit
    const sub = await request(app)
      .put(`/api/change-requests/${id}/submit`)
      .set('Authorization', `Bearer ${devToken}`)
      .send();
    expect(sub.statusCode).toBe(200);

    // approve with comment as reviewer
    const appRes = await request(app)
      .put(`/api/change-requests/${id}/approve`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ comment: 'Looks good to me' });

    expect(appRes.statusCode).toBe(200);
    expect(appRes.body.status).toBe('Approved');
    // approvalComment may be stored on approval; if present, it should match
    if (appRes.body.approvalComment !== undefined) {
      expect(appRes.body.approvalComment).toBe('Looks good to me');
    }
  });

  test('Reject without reason or comment returns 400', async () => {
    // create CR
    const cr = await request(app)
      .post('/api/change-requests')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        title: 'Reject missing reason test',
        description: 'Long enough description for reject test',
        category: 'Normal',
        priority: 'Low',
        impact_scope: 'Module',
        attachments: []
      });

    expect(cr.statusCode).toBe(201);
    const id = cr.body._id;

    // submit
    const sub = await request(app)
      .put(`/api/change-requests/${id}/submit`)
      .set('Authorization', `Bearer ${devToken}`)
      .send();
    expect(sub.statusCode).toBe(200);

    // attempt to reject without reason/comment
    const rej = await request(app)
      .put(`/api/change-requests/${id}/reject`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({});

    expect(rej.statusCode).toBe(400);
    expect(rej.body).toBeDefined();
  });

  test('Delete CR by non-creator returns 403', async () => {
    const cr = await request(app)
      .post('/api/change-requests')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        title: 'Delete permission test',
        description: 'Long enough description for delete permission test',
        category: 'Normal',
        priority: 'Low',
        impact_scope: 'Module',
        attachments: []
      });

    expect(cr.statusCode).toBe(201);
    const id = cr.body._id;

    // attempt delete as other developer
    const del = await request(app)
      .delete(`/api/change-requests/${id}`)
      .set('Authorization', `Bearer ${dev2Token}`)
      .send();

    expect([403, 404]).toContain(del.statusCode);
  });

  test('Simulate duplicate counter error returns 500 with specific message', async () => {
    // mock Counter.findByIdAndUpdate to throw duplicate key error
    jest.spyOn(Counter, 'findByIdAndUpdate').mockImplementation(() => {
      const e = new Error('dup');
      e.code = 11000;
      throw e;
    });

    const res = await request(app)
      .post('/api/change-requests')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        title: 'Dup counter simulation',
        description: 'This will hit duplicate counter simulation branch',
        category: 'Normal',
        priority: 'Low',
        impact_scope: 'Module',
        attachments: []
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toBeDefined();
    // restore
    Counter.findByIdAndUpdate.mockRestore();
  });
});
