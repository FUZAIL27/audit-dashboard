import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app';
import { UserModel } from '../models/user.model';
import { UserRole } from '../constants/enums';

const app = createApp();

async function loginAsFreshAdmin(): Promise<string> {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  await UserModel.create({ username: 'contract-tester', passwordHash, role: UserRole.ADMIN });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'contract-tester', password: 'Password123!' });

  return res.body.data.accessToken;
}

describe('API response envelope contract', () => {
  it('GET /api/health returns the standard success envelope', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'success']);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({ status: 'ok', timestamp: expect.any(String) })
    );
  });

  it('an unknown route returns the standard 404 error envelope', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: expect.any(String) },
    });
  });

  it('a validation failure always returns { success: false, error: { code, message } }', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toEqual(
      expect.objectContaining({ code: 'VALIDATION_ERROR', message: expect.any(String) })
    );
  });

  it('an authentication failure returns 401 with code UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/logs');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('a registration attempt always returns 403 FORBIDDEN with "Registration Disabled"', async () => {
    const res = await request(app).post('/api/auth/signup').send({});

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toBe('Registration Disabled');
  });

  it('sets standard rate-limit response headers on the auth endpoint', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ratelimit-probe', password: 'wrongpass' });

    expect(res.headers).toHaveProperty('ratelimit-limit');
    expect(res.headers).toHaveProperty('ratelimit-remaining');
  });

  it('sets baseline security headers (helmet) on every response', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
  });

  it('a successful paginated list response includes both data and meta', async () => {
    const token = await loginAsFreshAdmin();

    const res = await request(app).get('/api/logs').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        limit: expect.any(Number),
        totalCount: expect.any(Number),
        totalPages: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: expect.any(Boolean),
      })
    );
  });
});
