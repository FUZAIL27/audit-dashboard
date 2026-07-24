import { describe, it, expect } from 'vitest';
import { formatNumber, formatCompactNumber, formatDateTime } from './formatters';

describe('formatNumber', () => {
  it('formats large numbers with thousands separators', () => {
    expect(formatNumber(48213)).toBe('48,213');
  });
});

describe('formatCompactNumber', () => {
  it('compacts large numbers', () => {
    expect(formatCompactNumber(48213)).toMatch(/48/);
  });
});

describe('formatDateTime', () => {
  it('returns an em-dash for null/undefined input', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('formats a valid ISO string', () => {
    const result = formatDateTime('2026-01-15T10:00:00.000Z');
    expect(result).toMatch(/2026/);
  });
});
