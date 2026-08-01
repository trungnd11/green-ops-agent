import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './date';

describe('formatDate', () => {
  it('should format date string', () => {
    expect(formatDate('2026-06-30T00:00:00Z')).toBe('30/06/2026');
  });
});

describe('formatDateTime', () => {
  it('should format date time string', () => {
    const result = formatDateTime('2026-06-30T14:35:00');
    expect(result).toContain('30/06/2026');
    expect(result).toContain('14:35');
  });
});
