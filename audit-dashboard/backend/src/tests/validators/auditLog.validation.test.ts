import express, { Express } from 'express';
import request from 'supertest';
import { listLogsValidator, updateStatusValidator } from '../../validators/auditLog.validator';
import { validate } from '../../middlewares/validate.middleware';
import { errorHandler } from '../../middlewares/errorHandler.middleware';

function buildTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.get('/test-list', listLogsValidator, validate, (_req, res) => {
    res.status(200).json({ success: true, data: [] });
  });
  app.patch('/test-status/:id', updateStatusValidator, validate, (_req, res) => {
    res.status(200).json({ success: true, data: {} });
  });
  app.use(errorHandler);
  return app;
}

const app = buildTestApp();

describe('listLogsValidator', () => {
  it('accepts an empty query — every filter is optional', async () => {
    const res = await request(app).get('/test-list');
    expect(res.status).toBe(200);
  });

  it('rejects a limit value outside the fixed page-size options', async () => {
    const res = await request(app).get('/test-list').query({ limit: '37' });
    expect(res.status).toBe(400);
  });

  it('accepts each valid page-size option', async () => {
    for (const limit of ['10', '25', '50', '100']) {
      const res = await request(app).get('/test-list').query({ limit });
      expect(res.status).toBe(200);
    }
  });

  it('rejects an invalid severity value', async () => {
    const res = await request(app).get('/test-list').query({ severity: 'catastrophic' });
    expect(res.status).toBe(400);
  });

  it('accepts a valid comma-separated severity list', async () => {
    const res = await request(app).get('/test-list').query({ severity: 'critical,high' });
    expect(res.status).toBe(200);
  });

  it('rejects a sortBy field outside the sortable whitelist', async () => {
    const res = await request(app).get('/test-list').query({ sortBy: 'passwordHash' });
    expect(res.status).toBe(400);
  });
});

describe('updateStatusValidator', () => {
  it('rejects a non-Mongo-id path param', async () => {
    const res = await request(app).patch('/test-status/not-an-id').send({ status: 'resolved' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid status value', async () => {
    const res = await request(app)
      .patch('/test-status/507f1f77bcf86cd799439011')
      .send({ status: 'archived' });
    expect(res.status).toBe(400);
  });

  it('accepts a valid id and status combination', async () => {
    const res = await request(app)
      .patch('/test-status/507f1f77bcf86cd799439011')
      .send({ status: 'resolved' });
    expect(res.status).toBe(200);
  });
});
