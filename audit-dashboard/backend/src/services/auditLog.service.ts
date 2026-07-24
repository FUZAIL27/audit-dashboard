import { AnyBulkWriteOperation } from 'mongoose';
import { auditLogRepository } from '../repositories/auditLog.repository';
import {
  AuditLogEntity,
  AuditLogListQuery,
  AuditLogListResult,
  AuditLogDetailResult,
  BulkImportSummary,
} from '../interfaces/auditLog.interface';
import { NotFoundError, UnprocessableEntityError, ValidationError } from '../utils/AppError';
import { parseFileBuffer, resolveFileType } from '../utils/fileParser';
import { validateAndNormalizeRows, dedupeWithinBatch, NormalizedRow } from '../utils/rowValidator';
import { STATUS_TRANSITIONS, LogStatus } from '../constants/enums';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const MAX_INVALID_SAMPLE = 50;

export class AuditLogService {
  async importFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<BulkImportSummary> {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage().heapUsed;

    const fileType = resolveFileType(originalName, mimeType);
    const rawRows = parseFileBuffer(buffer, fileType);

    if (rawRows.length === 0) {
      throw new ValidationError('The uploaded file contains no rows to import');
    }

    const { valid, invalid } = validateAndNormalizeRows(rawRows);

    if (valid.length === 0) {
      throw new UnprocessableEntityError('No valid rows found in the uploaded file', {
        sample: invalid.slice(0, MAX_INVALID_SAMPLE),
      });
    }

    const { unique, duplicateCount: intraBatchDuplicates } = dedupeWithinBatch(valid);

    // Filter out rows that already exist in the DB (fingerprint match).
    const fingerprints = unique.map((row) => row.fingerprint);
    const existingFingerprints = await auditLogRepository.findExistingFingerprints(fingerprints);
    const rowsToInsert = unique.filter((row) => !existingFingerprints.has(row.fingerprint));
    const dbDuplicates = unique.length - rowsToInsert.length;

    const { insertedCount, writeErrorCount } = await this.batchInsert(rowsToInsert);

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage().heapUsed;

    const executionTimeMs = Number(endTime - startTime) / 1_000_000;
    const memoryUsageMb = Math.max((endMemory - startMemory) / (1024 * 1024), 0);

    const summary: BulkImportSummary = {
      insertedCount,
      duplicateCount: intraBatchDuplicates + dbDuplicates,
      failedCount: invalid.length + writeErrorCount,
      totalRows: rawRows.length,
      executionTimeMs: Math.round(executionTimeMs),
      memoryUsageMb: Math.round(memoryUsageMb * 100) / 100,
      invalidSample: invalid.slice(0, MAX_INVALID_SAMPLE),
    };

    logger.info(
      `Import complete: ${insertedCount} inserted, ${summary.duplicateCount} duplicates, ${summary.failedCount} failed (${summary.executionTimeMs}ms)`
    );

    return summary;
  }

  /**
   * Chunks rows into `UPLOAD_BATCH_SIZE`-sized `bulkWrite` calls. Each
   * `insertOne.document` is built as a complete `AuditLogEntity` (minus
   * `_id`) — including `createdAt`/`updatedAt` — because the MongoDB
   * driver's `InsertOneModel<AuditLogEntity>` type (`OptionalUnlessRequiredId`)
   * only makes `_id` optional; every other entity field, including the
   * timestamp fields Mongoose would otherwise default via `timestamps: true`,
   * must be present on the literal passed to `bulkWrite`. Supplying `now`
   * here is functionally identical to what the schema's timestamps plugin
   * would have set for a fresh insert.
   */
  private async batchInsert(
    rows: NormalizedRow[]
  ): Promise<{ insertedCount: number; writeErrorCount: number }> {
    const batchSize = env.UPLOAD_BATCH_SIZE;
    let insertedCount = 0;
    let writeErrorCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const now = new Date();

      const ops: AnyBulkWriteOperation<AuditLogEntity>[] = chunk.map((row) => ({
        insertOne: {
          document: {
            ...row,
            createdAt: now,
            updatedAt: now,
          },
        },
      }));

      const result = await auditLogRepository.bulkWrite(ops);
      insertedCount += result.insertedCount;
      writeErrorCount += result.writeErrorCount;
    }

    return { insertedCount, writeErrorCount };
  }

  async list(query: AuditLogListQuery): Promise<AuditLogListResult> {
    return auditLogRepository.list(query);
  }

  async getById(id: string): Promise<AuditLogDetailResult> {
    const log = await auditLogRepository.findById(id);
    if (!log) throw new NotFoundError('Audit log');

    const relatedLogs = await auditLogRepository.findRelated(
      log.actor,
      log.ipAddress,
      log._id.toString()
    );

    return { log, relatedLogs };
  }

  async updateStatus(id: string, newStatus: LogStatus): Promise<AuditLogEntity> {
    const existing = await auditLogRepository.findById(id);
    if (!existing) throw new NotFoundError('Audit log');

    const allowedTransitions = STATUS_TRANSITIONS[existing.status];
    if (existing.status !== newStatus && !allowedTransitions.includes(newStatus)) {
      throw new UnprocessableEntityError(
        `Cannot transition status from "${existing.status}" to "${newStatus}"`
      );
    }

    const updated = await auditLogRepository.updateStatus(id, newStatus);
    if (!updated) throw new NotFoundError('Audit log');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await auditLogRepository.deleteById(id);
    if (!deleted) throw new NotFoundError('Audit log');
  }
}

export const auditLogService = new AuditLogService();
