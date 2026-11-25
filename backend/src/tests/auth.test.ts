import request from 'supertest';
import { app } from '../index.js';
import { dbStore } from '../repositories/store.js';

describe('Authentication & RBAC Tests (FR-9, FR-12, UC-01, UC-12)', () => {
  beforeAll(async () => {
    await dbStore.initSeed();
  });

  it('should authenticate Administrator with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: 'admin',
        password: 'AdminPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should authenticate Traffic Police with valid credentials and return assigned intersections', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: 'officer_mesay',
        password: 'OfficerPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('TRAFFIC_POLICE');
    expect(res.body.data.user.assignments).toBeDefined();
    expect(res.body.data.user.assignments.length).toBeGreaterThan(0);
  });

  it('should reject invalid credentials with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: 'admin',
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should deny login for deactivated / inactive accounts (Policy enforcement)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: 'officer_inactive',
        password: 'OfficerPassword123!',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('should allow token refresh', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: 'admin',
        password: 'AdminPassword123!',
      });

    const refreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
  });

  it('should fetch user profile for authenticated user via /auth/me', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        usernameOrEmail: 'admin',
        password: 'AdminPassword123!',
      });

    const token = loginRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('admin@traffic.wcu.edu.et');
  });
});
