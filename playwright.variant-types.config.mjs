import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/variant-types', outputDir: './test-results/variant-types', workers: 1, timeout: 30000,
  use: { headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5198' },
  projects: [{ name: 'desktop', use: { viewport: { width: 1366, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5198 --strictPort',
    url: 'https://localhost:5198/tests/variant-types/index.html', ignoreHTTPSErrors: true, reuseExistingServer: false },
});
