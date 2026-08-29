import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        'node_modules',
        'tests',
        'app',
        'components/ui',
        'instrumentation.ts',
        'middleware.ts',
        '**/*.config.{ts,mjs}',
        '**/types.ts',
        '**/migrate.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 35,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/app': path.resolve(__dirname, 'app'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/src': path.resolve(__dirname, 'src'),
    },
  },
});

function dirname(url: string) {
  return url.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
}
