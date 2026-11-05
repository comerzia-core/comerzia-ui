import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/public', outputDir: './test-results/public', testMatch: '**/*.spec.mjs', timeout: 45000, workers: 1,
  use: { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5201' },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5201 --strictPort', url: 'https://localhost:5201', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
