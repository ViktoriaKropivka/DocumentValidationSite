import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'cd ../backend && python main.py',
    url: 'http://localhost:8000/docs',
    reuseExistingServer: true,
  },
});