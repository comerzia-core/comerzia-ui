import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/themes', outputDir: './test-results/themes', testMatch: '**/*.spec.mjs', timeout: 30000, workers: 1,
  use: { channel: 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5190' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5190 --strictPort',
    url: 'https://localhost:5190/tests/themes/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
