import { describe, it, expect } from 'vitest';
import { maskCCCD, maskBankAccount, maskPhone } from './mask';

describe('maskCCCD', () => {
  it('should mask middle digits', () => {
    expect(maskCCCD('001012345900')).toBe('0010•••••900');
  });
});

describe('maskBankAccount', () => {
  it('should show last 4 digits', () => {
    expect(maskBankAccount('123456782688')).toBe('•••• 2688');
  });
});

describe('maskPhone', () => {
  it('should mask middle digits', () => {
    expect(maskPhone('0912345678')).toBe('0912 ••• 678');
  });
});
