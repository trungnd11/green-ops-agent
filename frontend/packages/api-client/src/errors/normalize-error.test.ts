import { describe, it, expect } from 'vitest';
import { normalizeError } from './normalize-error';

describe('normalizeError', () => {
  it('should handle string error', () => {
    const result = normalizeError(new Error('Network error'));
    expect(result.message).toBe('Network error');
  });

  it('should handle unknown error', () => {
    const result = normalizeError('something');
    expect(result.message).toBe('An unknown error occurred');
  });

  it('should handle null error', () => {
    const result = normalizeError(null);
    expect(result.message).toBe('An unknown error occurred');
  });
});
