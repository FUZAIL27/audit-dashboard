import { z } from 'zod';
import crypto from 'crypto';
import { Severity, LogStatus } from '../constants/enums';
import { AuditLogCreateInput } from '../interfaces/auditLog.interface';
import { RawRow } from './fileParser';

const rowSchema = z.object({
  actor: z.string().min(1).max(256),
  role: z.string().min(1).max(64),
  action: z.string().min(1).max(128),
  resource: z.string().min(1).max(512),
  resourceType: z.string().min(1).max(64),
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/, 'Invalid IP address'),
  region: z.string().min(1).max(64),
  severity: z.nativeEnum(Severity),
  status: z.nativeEnum(LogStatus).optional().default(LogStatus.PENDING),
  timestamp: z.coerce.date(),
});

/**
 * A fully validated, normalized row — structurally identical to the DTO
 * the repository/service expect for insertion, so no further mapping is
 * needed between validation and persistence.
 */
export type NormalizedRow = AuditLogCreateInput;

export interface RowValidationResult {
  valid: NormalizedRow[];
  invalid: { row: number; reason: string }[];
}

function computeFingerprint(row: {
  actor: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: Date;
}): string {
  const raw = `${row.actor}|${row.action}|${row.resource}|${row.ipAddress}|${row.timestamp.toISOString()}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Normalizes a raw parsed row's keys to be case/whitespace tolerant
 * (e.g. "IP Address", "ip_address", "ipAddress" all map to ipAddress),
 * since CSV/Excel exports rarely match camelCase exactly.
 */
function normalizeKeys(row: RawRow): RawRow {
  const keyMap: Record<string, string> = {
    actor: 'actor',
    role: 'role',
    action: 'action',
    resource: 'resource',
    resourcetype: 'resourceType',
    'resource type': 'resourceType',
    ipaddress: 'ipAddress',
    'ip address': 'ipAddress',
    ip: 'ipAddress',
    region: 'region',
    severity: 'severity',
    status: 'status',
    timestamp: 'timestamp',
    date: 'timestamp',
  };

  const normalized: RawRow = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.trim().toLowerCase();
    const mappedKey = keyMap[cleanKey] ?? key;
    normalized[mappedKey] = typeof value === 'string' ? value.trim() : value;
  }
  return normalized;
}

export function validateAndNormalizeRows(rows: RawRow[]): RowValidationResult {
  const valid: NormalizedRow[] = [];
  const invalid: { row: number; reason: string }[] = [];

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for header row
    const normalizedInput = normalizeKeys(rawRow);

    // Lowercase enum-like fields defensively before validation.
    if (typeof normalizedInput.severity === 'string') {
      normalizedInput.severity = normalizedInput.severity.toLowerCase();
    }
    if (typeof normalizedInput.status === 'string') {
      normalizedInput.status = normalizedInput.status.toLowerCase();
    }

    const result = rowSchema.safeParse(normalizedInput);
    if (!result.success) {
      const reason = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      invalid.push({ row: rowNumber, reason });
      return;
    }

    const fingerprint = computeFingerprint(result.data);
    const normalizedRow: NormalizedRow = {
      ...result.data,
      metadata: {},
      fingerprint,
    };
    valid.push(normalizedRow);
  });

  return { valid, invalid };
}

/**
 * De-duplicates rows within the same uploaded file (a file might legitimately
 * contain the same fingerprint twice — export tooling glitches happen).
 */
export function dedupeWithinBatch(rows: NormalizedRow[]): {
  unique: NormalizedRow[];
  duplicateCount: number;
} {
  const seen = new Set<string>();
  const unique: NormalizedRow[] = [];
  let duplicateCount = 0;

  for (const row of rows) {
    if (seen.has(row.fingerprint)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(row.fingerprint);
    unique.push(row);
  }

  return { unique, duplicateCount };
}
