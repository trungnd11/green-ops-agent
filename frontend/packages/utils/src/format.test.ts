import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('should format positive number', () => {
    expect(formatCurrency(47165000)).toBe('47.165.000 ₫');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('0 ₫');
  });

  it('should format large number', () => {
    expect(formatCurrency(113104000)).toBe('113.104.000 ₫');
  });
});
