import { describe, it, expect } from 'vitest';
import { loginSchema } from './login.schema';

describe('loginSchema', () => {
  it('should accept valid credentials', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('should reject empty username', () => {
    const result = loginSchema.safeParse({ username: '', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: '' });
    expect(result.success).toBe(false);
  });
});
