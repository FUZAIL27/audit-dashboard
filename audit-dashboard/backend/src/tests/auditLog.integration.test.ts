import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app';
import { UserModel } from '../models/user.model';
import { AuditLogModel } from '../models/auditLog.model';
import { UserRole, Severity, LogStatus } from '../constants/enums';

const app = createApp();

async function createTestUser(username: string, role: UserRole = UserRole.ADMIN) {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  return UserModel.create({ username, passwordHash, role });
}

async function loginAs(username: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password: 'Password123!' });
  return res.body.data.accessToken;
}

describe('GET /api/logs', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(401);
  });

  it('returns a paginated, filtered list for authenticated users', async () => {
    await createTestUser('admin1', UserRole.ADMIN);
    const token = await loginAs('admin1');

    await AuditLogModel.create([
      {
        actor: 'alice@company.com',
        role: 'admin',
        action: 'USER_LOGIN',
        resource: 'console',
        resourceType: 'APP',
        ipAddress: '10.0.0.1',
        region: 'us-east-1',
        severity: Severity.CRITICAL,
        status: LogStatus.PENDING,
        timestamp: new Date(),
        fingerprint: 'fp1',
      },
      {
        actor: 'bob@company.com',
        role: 'viewer',
        action: 'FILE_DOWNLOAD',
        resource: 's3://bucket/file',
        resourceType: 'S3_BUCKET',
        ipAddress: '10.0.0.2',
        region: 'eu-west-1',
        severity: Severity.LOW,
        status: LogStatus.RESOLVED,
        timestamp: new Date(),
        fingerprint: 'fp2',
      },
    ]);

    const res = await request(app)
      .get('/api/logs')
      .query({ severity: 'critical' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].actor).toBe('alice@company.com');
    expect(res.body.meta.totalCount).toBe(1);
  });

  it('allows an admin to delete a log', async () => {
    await createTestUser('admin2', UserRole.ADMIN);
    const token = await loginAs('admin2');

    const log = await AuditLogModel.create({
      actor: 'a',
      role: 'a',
      action: 'a',
      resource: 'a',
      resourceType: 'a',
      ipAddress: '10.0.0.1',
      region: 'us-east-1',
      severity: Severity.LOW,
      status: LogStatus.PENDING,
      timestamp: new Date(),
      fingerprint: 'fp3',
    });

    const res = await request(app)
      .delete(`/api/logs/${log._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deletedId).toBe(log._id.toString());
  });

  it('returns 404 for a non-existent log id', async () => {
    await createTestUser('admin3', UserRole.ADMIN);
    const token = await loginAs('admin3');

    const res = await request(app)
      .get('/api/logs/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
