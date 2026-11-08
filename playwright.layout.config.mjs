import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/layout', outputDir: './test-results/layout', timeout: 45000, workers: 1,
  use: { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge', headless: true, ignoreHTTPSErrors: true },
  projects: [
    ...['desktop','mobile'].map(name => ({ name: 'dev-'+name, testMatch: 'components.spec.mjs', use: {
      baseURL: 'https://localhost:5211', viewport: name === 'desktop' ? { width:1366,height:900 } : { width:390,height:844 },
      isMobile: name === 'mobile', hasTouch: name === 'mobile' } })),
    ...['desktop','mobile'].map(name => ({ name: 'build-'+name, testMatch: 'compiled.spec.mjs', use: {
      baseURL: 'https://localhost:5212', viewport: name === 'desktop' ? { width:1366,height:900 } : { width:390,height:844 } } })),
  ],
  webServer: [
    { command:'npm run dev -- --host 127.0.0.1 --port 5211 --strictPort', url:'https://localhost:5211', ignoreHTTPSErrors:true },
    { command:'npm run preview -- --host 127.0.0.1 --port 5212 --strictPort', url:'https://localhost:5212', ignoreHTTPSErrors:true },
  ],
});
