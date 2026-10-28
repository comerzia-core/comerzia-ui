import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/returns', testMatch: '**/*.spec.mjs', outputDir: './test-results/returns', timeout: 30000, workers: 1,
  use: { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5194', timezoneId: 'Asia/Tokyo' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5194 --strictPort',
    url: 'https://localhost:5194/tests/returns/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
