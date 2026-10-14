import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/images', testMatch: '**/*.spec.mjs', timeout: 30000, workers: 1,
  use: { channel: 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5188' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: [
    { command: 'npm run dev -- --host 127.0.0.1 --port 5188 --strictPort',
      url: 'https://localhost:5188/tests/images/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false },
    { command: 'node tests/images/image-server.mjs', url: 'http://127.0.0.1:5189/stats', reuseExistingServer: false },
  ],
});
