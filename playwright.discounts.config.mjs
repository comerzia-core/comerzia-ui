import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/discounts', testMatch: '**/*.spec.mjs', outputDir: './test-results/discounts', timeout: 30000, workers: 1,
  use: { channel: 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5195' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5195 --strictPort',
    url: 'https://localhost:5195/tests/discounts/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
