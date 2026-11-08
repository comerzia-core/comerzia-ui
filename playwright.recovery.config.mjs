import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/privileged-recovery', outputDir: './test-results/privileged-recovery', workers: 1, timeout: 45000,
  use: { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge', baseURL: 'https://localhost:5217', ignoreHTTPSErrors: true },
  projects: [{ name: 'desktop', use: { viewport: {width:1366,height:900} } }, { name: 'mobile', use: { viewport: {width:390,height:844},isMobile:true,hasTouch:true } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5217 --strictPort', url: 'https://localhost:5217', ignoreHTTPSErrors: true,
    env: { VITE_API_URL: 'https://localhost:5217/api' } },
});
