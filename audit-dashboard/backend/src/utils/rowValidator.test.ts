import { validateAndNormalizeRows, dedupeWithinBatch } from '../utils/rowValidator';
import { Severity, LogStatus } from '../constants/enums';

describe('validateAndNormalizeRows', () => {
  it('accepts a well-formed row and normalizes header variants', () => {
    const rows = [
      {
        Actor: 'jane@company.com',
        role: 'admin',
        action: 'USER_LOGIN',
        resource: 'arn:aws:iam::123:role/Admin',
        'Resource Type': 'IAM_ROLE',
        'IP Address': '10.0.0.5',
        region: 'us-east-1',
        severity: 'CRITICAL',
        status: 'Pending',
        timestamp: '2026-01-15T10:00:00.000Z',
      },
    ];

    const { valid, invalid } = validateAndNormalizeRows(rows);

    expect(invalid).toHaveLength(0);
    expect(valid).toHaveLength(1);
    expect(valid[0].severity).toBe(Severity.CRITICAL);
    expect(valid[0].status).toBe(LogStatus.PENDING);
    expect(valid[0].resourceType).toBe('IAM_ROLE');
    expect(valid[0].fingerprint).toHaveLength(64); // sha256 hex
  });

  it('rejects a row with an invalid severity and reports the row number', () => {
    const rows = [
      {
        actor: 'a',
        role: 'a',
        action: 'a',
        resource: 'a',
        resourceType: 'a',
        ipAddress: '10.0.0.1',
        region: 'us-east-1',
        severity: 'not-a-severity',
        timestamp: '2026-01-15T10:00:00.000Z',
      },
    ];

    const { valid, invalid } = validateAndNormalizeRows(rows);

    expect(valid).toHaveLength(0);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].row).toBe(2); // header + 1-index offset
    expect(invalid[0].reason).toMatch(/severity/i);
  });

  it('rejects a row with a malformed IP address', () => {
    const rows = [
      {
        actor: 'a',
        role: 'a',
        action: 'a',
        resource: 'a',
        resourceType: 'a',
        ipAddress: 'not-an-ip!!',
        region: 'us-east-1',
        severity: 'low',
        timestamp: '2026-01-15T10:00:00.000Z',
      },
    ];

    const { invalid } = validateAndNormalizeRows(rows);
    expect(invalid).toHaveLength(1);
  });

  it('continues processing remaining rows after an invalid row', () => {
    const validRow = {
      actor: 'a',
      role: 'a',
      action: 'a',
      resource: 'a',
      resourceType: 'a',
      ipAddress: '10.0.0.1',
      region: 'us-east-1',
      severity: 'low',
      timestamp: '2026-01-15T10:00:00.000Z',
    };
    const invalidRow = { ...validRow, severity: 'bogus' };

    const { valid, invalid } = validateAndNormalizeRows([invalidRow, validRow]);
    expect(invalid).toHaveLength(1);
    expect(valid).toHaveLength(1);
  });
});

describe('dedupeWithinBatch', () => {
  it('removes rows sharing the same fingerprint within a single batch', () => {
    const row = {
      actor: 'a',
      role: 'a',
      action: 'a',
      resource: 'a',
      resourceType: 'a',
      ipAddress: '10.0.0.1',
      region: 'us-east-1',
      severity: Severity.LOW,
      status: LogStatus.PENDING,
      timestamp: new Date('2026-01-15T10:00:00.000Z'),
      metadata: {},
      fingerprint: 'abc123',
    };

    const { unique, duplicateCount } = dedupeWithinBatch([row, { ...row }, { ...row }]);
    expect(unique).toHaveLength(1);
    expect(duplicateCount).toBe(2);
  });
});
