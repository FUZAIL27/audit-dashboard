import { apiClient } from './axiosClient';
import {
  AuditLog,
  AuditLogDetail,
  AuditLogListParams,
  AuditLogListResponse,
  BulkImportSummary,
} from '@/types/auditLog.types';
import { LogStatus } from '@/constants/enums';

function toQueryParams(params: AuditLogListParams): Record<string, string> {
  const q: Record<string, string> = {
    page: String(params.page),
    limit: String(params.limit),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
  if (params.search) q.search = params.search;
  if (params.severity?.length) q.severity = params.severity.join(',');
  if (params.status?.length) q.status = params.status.join(',');
  if (params.region?.length) q.region = params.region.join(',');
  if (params.resourceType?.length) q.resourceType = params.resourceType.join(',');
  if (params.actor) q.actor = params.actor;
  if (params.action) q.action = params.action;
  if (params.dateFrom) q.dateFrom = params.dateFrom;
  if (params.dateTo) q.dateTo = params.dateTo;
  return q;
}

export const auditLogService = {
  async list(params: AuditLogListParams): Promise<AuditLogListResponse> {
    const { data } = await apiClient.get('/logs', { params: toQueryParams(params) });
    return data as AuditLogListResponse;
  },

  async getById(id: string): Promise<AuditLogDetail> {
    const { data } = await apiClient.get(`/logs/${id}`);
    return data.data as AuditLogDetail;
  },

  async updateStatus(id: string, status: LogStatus): Promise<AuditLog> {
    const { data } = await apiClient.patch(`/logs/${id}/status`, { status });
    return data.data as AuditLog;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/logs/${id}`);
  },

  async upload(file: File, onProgress?: (percent: number) => void): Promise<BulkImportSummary> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post('/logs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
    return data.data as BulkImportSummary;
  },
};
