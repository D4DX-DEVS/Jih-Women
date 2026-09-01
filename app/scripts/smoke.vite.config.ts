// Config for the headless admin smoke test only. publicDir is off because the
// harness renders components, not assets.
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  resolve: { alias: { '@': path.resolve(__dirname, '../src') } },
  build: { ssr: 'scripts/smoke-entry.tsx', outDir: '.smoke' },
});
