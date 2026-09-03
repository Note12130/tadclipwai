import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{js,ts}'],
  },
});
