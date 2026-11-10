import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/product-variants',
  outputDir: './test-results/product-variants',
  timeout: 30000,
  workers: 1,
  use: { headless: true, ignoreHTTPSErrors: true, baseURL: 'https://localhost:5196' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5196 --strictPort',
    url: 'https://localhost:5196/tests/product-variants/index.html',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
  },
});
