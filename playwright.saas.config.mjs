import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/saas',outputDir:'./test-results/saas',testMatch:'**/*.spec.mjs',timeout:40000,workers:1,
 use:{channel:'msedge',headless:true,ignoreHTTPSErrors:true,baseURL:'https://localhost:5193'},
 projects:[{name:'desktop',use:{viewport:{width:1366,height:900}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}],
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5193 --strictPort',url:'https://localhost:5193/tests/saas/index.html',ignoreHTTPSErrors:true,reuseExistingServer:false}
});
