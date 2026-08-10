import reactConfig from '@xanh/eslint-config/react';

export default [
  ...reactConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.gen.ts', '*.config.*'],
  },
];
