import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/storefront', outputDir: './test-results/storefront', testMatch: '**/*.spec.mjs', timeout: 45000, workers: 1,
  use: { channel: 'msedge', headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5209' },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 960 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5209 --strictPort', url: 'https://localhost:5209', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
