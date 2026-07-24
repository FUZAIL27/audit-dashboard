import request from 'supertest';
import { createApp } from '../app';
import { seedAdminUser } from '../services/adminSeed.service';
import { env } from '../config/env';

const app = createApp();
const { ADMIN_USERNAME, ADMIN_PASSWORD } = env;

describe('POST /api/auth/signup and /api/auth/register — registration disabled', () => {
  it('returns 403 Registration Disabled for /signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'anyone', password: 'whatever' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Registration Disabled');
  });

  it('returns 403 Registration Disabled for /register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'anyone', password: 'whatever' });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Registration Disabled');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in successfully with the seeded admin credentials', async () => {
    await seedAdminUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user).toEqual(
      expect.objectContaining({ username: ADMIN_USERNAME, role: 'admin' })
    );
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects an incorrect password', async () => {
    await seedAdminUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: ADMIN_USERNAME, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a username that does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'whatever' });

    expect(res.status).toBe(401);
  });

  it('rejects a missing username with a validation error', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'Admin@123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a missing password with a validation error', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: ADMIN_USERNAME });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/me', () => {
  it("returns the authenticated admin's own profile", async () => {
    await seedAdminUser();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(ADMIN_USERNAME);
    expect(res.body.data.role).toBe('admin');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed bearer token with 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh and /api/auth/logout', () => {
  it('issues a fresh access token from the refresh cookie, then logout clears it', async () => {
    await seedAdminUser();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.loggedOut).toBe(true);
  });

  it('rejects a refresh request with no cookie present', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});
