import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/preflight', outputDir: './test-results/preflight', timeout: 30000, workers: 1,
  use: { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5209' },
  projects: [{ name: 'desktop', use: { viewport: { width: 1366, height: 900 } } }, { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5209 --strictPort', url: 'https://localhost:5209/tests/preflight/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
