import { FilterQuery, SortOrder, Types, AnyBulkWriteOperation } from 'mongoose';
import { AuditLogModel } from '../models/auditLog.model';
import { Severity, LogStatus } from '../constants/enums';
import {
  AuditLogEntity,
  AuditLogCreateInput,
  AuditLogListQuery,
  AuditLogListResult,
  AuditLogActivityItem,
  DashboardStats,
  DashboardCharts,
  ChartDataPoint,
  SeverityDistributionPoint,
  RegionBreakdownPoint,
  HeatmapPoint,
} from '../interfaces/auditLog.interface';

/** Shape of a `$gte`/`$lte` range condition on a `Date` field. */
interface DateRangeCondition {
  $gte?: Date;
  $lte?: Date;
}

/**
 * Builds a single, fully-formed range condition object rather than
 * incrementally mutating `filter.timestamp` property-by-property — the
 * latter is what previously produced "FilterQuery mismatch" errors, since
 * `FilterQuery<T>[K]` narrows to a union type that TypeScript cannot
 * re-widen across separate mutating statements.
 */
function buildDateRangeCondition(dateFrom?: Date, dateTo?: Date): DateRangeCondition | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const condition: DateRangeCondition = {};
  if (dateFrom) condition.$gte = dateFrom;
  if (dateTo) condition.$lte = dateTo;
  return condition;
}

function buildFilterQuery(params: AuditLogListQuery): FilterQuery<AuditLogEntity> {
  const filter: FilterQuery<AuditLogEntity> = {};

  if (params.search) {
    filter.$text = { $search: params.search };
  }
  if (params.severity?.length) {
    filter.severity = { $in: params.severity };
  }
  if (params.status?.length) {
    filter.status = { $in: params.status };
  }
  if (params.role?.length) {
    filter.role = { $in: params.role };
  }
  if (params.region?.length) {
    filter.region = { $in: params.region };
  }
  if (params.resourceType?.length) {
    filter.resourceType = { $in: params.resourceType };
  }
  if (params.actor) {
    filter.actor = { $regex: params.actor, $options: 'i' };
  }
  if (params.action) {
    filter.action = { $regex: params.action, $options: 'i' };
  }

  const dateRange = buildDateRangeCondition(params.dateFrom, params.dateTo);
  if (dateRange) {
    filter.timestamp = dateRange;
  }

  return filter;
}

/** Result of a chunked bulk-insert batch — counts only, never raw driver errors. */
export interface BulkWriteBatchResult {
  insertedCount: number;
  writeErrorCount: number;
}

/**
 * Structural shape of a MongoDB bulk-write failure. Declared locally
 * (rather than importing `MongoBulkWriteError` from the `mongodb` driver
 * package directly) so the repository has no dependency beyond `mongoose`
 * itself, while still avoiding `any`/`unknown` when reading the error.
 */
interface MongoBulkWriteFailure {
  message: string;
  result?: { insertedCount?: number };
  writeErrors?: { index: number; code: number; errmsg: string }[];
}

function isMongoBulkWriteFailure(error: Error): error is Error & MongoBulkWriteFailure {
  return 'writeErrors' in error || 'result' in error;
}

interface FingerprintProjection {
  fingerprint: string;
}

interface CountFacetEntry {
  count: number;
}

interface SeverityBucket {
  _id: Severity;
  count: number;
}

interface StatusBucket {
  _id: LogStatus;
  count: number;
}

interface AuditLogStatsFacet {
  totalLogs: CountFacetEntry[];
  todayLogs: CountFacetEntry[];
  bySeverity: SeverityBucket[];
  byStatus: StatusBucket[];
  uniqueActors: CountFacetEntry[];
  latestActivity: { timestamp: Date }[];
  latestUpload: { createdAt: Date }[];
}

export class AuditLogRepository {
  /**
   * Single-document insert. Uses `Model.create`, whose input type
   * (`AnyKeys<AuditLogEntity>`) treats every field as optional — the
   * correct, lenient typing for an insert path where Mongoose still
   * applies schema defaults (including `timestamps: true`) itself.
   */
  async create(data: AuditLogCreateInput): Promise<AuditLogEntity> {
    const created = await AuditLogModel.create(data);
    return created.toObject<AuditLogEntity>();
  }

  /**
   * Chunked bulk insert for high-volume imports (10,000-50,000+ rows).
   * `AnyBulkWriteOperation<AuditLogEntity>`'s `insertOne.document` is typed
   * as `OptionalUnlessRequiredId<AuditLogEntity>` by the underlying MongoDB
   * driver — every field is required except `_id`. The service layer is
   * responsible for supplying a complete `AuditLogEntity`-shaped document
   * (including `createdAt`/`updatedAt`) for each operation; this method
   * only executes the batch and normalizes the result/error shape.
   */
  async bulkWrite(ops: AnyBulkWriteOperation<AuditLogEntity>[]): Promise<BulkWriteBatchResult> {
    if (ops.length === 0) {
      return { insertedCount: 0, writeErrorCount: 0 };
    }

    try {
      const result = await AuditLogModel.bulkWrite(ops, { ordered: false });
      return { insertedCount: result.insertedCount, writeErrorCount: 0 };
    } catch (error) {
      if (error instanceof Error && isMongoBulkWriteFailure(error)) {
        return {
          insertedCount: error.result?.insertedCount ?? 0,
          writeErrorCount: error.writeErrors?.length ?? 0,
        };
      }
      throw error;
    }
  }

  async findExistingFingerprints(fingerprints: string[]): Promise<Set<string>> {
    if (fingerprints.length === 0) return new Set();
    const existing = await AuditLogModel.find(
      { fingerprint: { $in: fingerprints } },
      { fingerprint: 1, _id: 0 }
    ).lean<FingerprintProjection[]>();
    return new Set(existing.map((doc) => doc.fingerprint));
  }

  async findById(id: string): Promise<AuditLogEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AuditLogModel.findById(id).lean<AuditLogEntity | null>();
  }

  async findRelated(
    actor: string,
    ipAddress: string,
    excludeId: string,
    limit = 5
  ): Promise<AuditLogEntity[]> {
    return AuditLogModel.find({
      _id: { $ne: excludeId },
      $or: [{ actor }, { ipAddress }],
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<AuditLogEntity[]>();
  }

  async list(params: AuditLogListQuery): Promise<AuditLogListResult> {
    const filter = buildFilterQuery(params);
    const sort: Record<string, SortOrder> = {
      [params.sortBy]: params.sortOrder === 'asc' ? 1 : -1,
    };
    const skip = (params.page - 1) * params.limit;

    const [logs, totalCount] = await Promise.all([
      AuditLogModel.find(filter).sort(sort).skip(skip).limit(params.limit).lean<AuditLogEntity[]>(),
      AuditLogModel.countDocuments(filter),
    ]);

    return { logs, totalCount };
  }

  async updateStatus(id: string, status: LogStatus): Promise<AuditLogEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AuditLogModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean<AuditLogEntity | null>();
  }

  async deleteById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await AuditLogModel.findByIdAndDelete(id).lean<AuditLogEntity | null>();
    return result !== null;
  }

  async getRecentActivity(limit = 20): Promise<AuditLogActivityItem[]> {
    return AuditLogModel.find({}, { actor: 1, action: 1, severity: 1, status: 1, timestamp: 1 })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<AuditLogActivityItem[]>();
  }

  async getStats(dateFrom?: Date, dateTo?: Date): Promise<DashboardStats> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rangeMatch: FilterQuery<AuditLogEntity> = {};
    const dateRange = buildDateRangeCondition(dateFrom, dateTo);
    if (dateRange) {
      rangeMatch.timestamp = dateRange;
    }

    const [facetResult] = await AuditLogModel.aggregate<AuditLogStatsFacet>([
      { $match: rangeMatch },
      {
        $facet: {
          totalLogs: [{ $count: 'count' }],
          todayLogs: [{ $match: { timestamp: { $gte: startOfDay } } }, { $count: 'count' }],
          bySeverity: [{ $group: { _id: '$severity', count: { $sum: 1 } } }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          uniqueActors: [{ $group: { _id: '$actor' } }, { $count: 'count' }],
          latestActivity: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
            { $project: { timestamp: 1, _id: 0 } },
          ],
          latestUpload: [
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { createdAt: 1, _id: 0 } },
          ],
        },
      },
    ]);

    const bySeverity: Partial<Record<Severity, number>> = {};
    for (const bucket of facetResult.bySeverity) {
      bySeverity[bucket._id] = bucket.count;
    }

    const byStatus: Partial<Record<LogStatus, number>> = {};
    for (const bucket of facetResult.byStatus) {
      byStatus[bucket._id] = bucket.count;
    }

    return {
      totalLogs: facetResult.totalLogs[0]?.count ?? 0,
      todayLogs: facetResult.todayLogs[0]?.count ?? 0,
      bySeverity,
      byStatus,
      uniqueActors: facetResult.uniqueActors[0]?.count ?? 0,
      latestActivity: facetResult.latestActivity[0]?.timestamp ?? null,
      latestUpload: facetResult.latestUpload[0]?.createdAt ?? null,
    };
  }

  async getCharts(
    dateFrom?: Date,
    dateTo?: Date,
    granularity: 'day' | 'hour' = 'day'
  ): Promise<DashboardCharts> {
    const rangeMatch: FilterQuery<AuditLogEntity> = {};
    const dateRange = buildDateRangeCondition(dateFrom, dateTo);
    if (dateRange) {
      rangeMatch.timestamp = dateRange;
    }

    const [timeline, severityDistribution, regionBreakdown, heatmap] = await Promise.all([
      AuditLogModel.aggregate<ChartDataPoint>([
        { $match: rangeMatch },
        {
          $group: {
            _id: { $dateTrunc: { date: '$timestamp', unit: granularity } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: granularity === 'day' ? '%Y-%m-%d' : '%Y-%m-%dT%H:00:00Z',
                date: '$_id',
              },
            },
            count: 1,
          },
        },
      ]),
      AuditLogModel.aggregate<SeverityDistributionPoint>([
        { $match: rangeMatch },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $project: { _id: 0, severity: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]),
      AuditLogModel.aggregate<RegionBreakdownPoint>([
        { $match: rangeMatch },
        { $group: { _id: '$region', count: { $sum: 1 } } },
        { $project: { _id: 0, region: '$_id', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      AuditLogModel.aggregate<HeatmapPoint>([
        { $match: rangeMatch },
        {
          $group: {
            _id: {
              dayOfWeek: { $dayOfWeek: '$timestamp' },
              hour: { $hour: '$timestamp' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            dayOfWeek: '$_id.dayOfWeek',
            hour: '$_id.hour',
            count: 1,
          },
        },
      ]),
    ]);

    return { timeline, severityDistribution, regionBreakdown, heatmap };
  }
}

export const auditLogRepository = new AuditLogRepository();
