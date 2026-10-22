import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 120_000,
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:5176',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5176',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'laptop', use: { viewport: { width: 1024, height: 768 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'small-mobile', use: { viewport: { width: 320, height: 740 } } },
  ],
});
