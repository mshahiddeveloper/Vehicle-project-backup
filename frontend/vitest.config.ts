import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    reporters: ['default'],
    testTimeout: 10000,
    isolate: true,
  },
});
