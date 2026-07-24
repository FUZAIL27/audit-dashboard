import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { ValidationError } from './AppError';

export type RawRow = Record<string, unknown>;

export type SupportedMimeType =
  | 'text/csv'
  | 'application/json'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-excel';

const EXTENSION_MAP: Record<string, SupportedMimeType> = {
  csv: 'text/csv',
  json: 'application/json',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
};

export function resolveFileType(originalName: string, mimeType: string): SupportedMimeType {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
  if (EXTENSION_MAP[ext]) return EXTENSION_MAP[ext];

  if (mimeType.includes('csv')) return 'text/csv';
  if (mimeType.includes('json')) return 'application/json';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  throw new ValidationError(
    `Unsupported file type "${ext || mimeType}". Accepted types: csv, json, xlsx, xls.`
  );
}

export function parseFileBuffer(buffer: Buffer, fileType: SupportedMimeType): RawRow[] {
  switch (fileType) {
    case 'text/csv':
      return parseCsvBuffer(buffer);
    case 'application/json':
      return parseJsonBuffer(buffer);
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return parseExcelBuffer(buffer);
    default:
      throw new ValidationError('Unsupported file type');
  }
}

function parseCsvBuffer(buffer: Buffer): RawRow[] {
  try {
    const records = parseCsv(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
    return records as RawRow[];
  } catch (err) {
    throw new ValidationError('Failed to parse CSV file', { cause: (err as Error).message });
  }
}

function parseJsonBuffer(buffer: Buffer): RawRow[] {
  try {
    const parsed = JSON.parse(buffer.toString('utf-8'));
    if (Array.isArray(parsed)) return parsed as RawRow[];
    if (Array.isArray(parsed?.logs)) return parsed.logs as RawRow[];
    throw new Error('Expected a JSON array of log objects (or { "logs": [...] })');
  } catch (err) {
    throw new ValidationError('Failed to parse JSON file', { cause: (err as Error).message });
  }
}

function parseExcelBuffer(buffer: Buffer): RawRow[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
  } catch (err) {
    throw new ValidationError('Failed to parse Excel file', { cause: (err as Error).message });
  }
}
