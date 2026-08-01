import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    alias: { '@': './src' },
    entry: { index: './src/main.tsx' },
  },
  html: {
    template: './index.html',
  },
  server: {
    port: 3002,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: ['@tailwindcss/postcss'],
      },
    },
  },
});
