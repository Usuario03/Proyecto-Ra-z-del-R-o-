import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./e2e', timeout:45000, expect:{timeout:10000}, fullyParallel:true,
  workers:2, reporter:'list', use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'npm run build && npm run preview -- --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:120000},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1366,height:900}}},{name:'mobile',use:{...devices['Pixel 7']}}],
});
