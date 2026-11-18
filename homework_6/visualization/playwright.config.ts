import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir:'./e2e',
  timeout:60000,
  use:{baseURL:process.env.HW6_URL ?? 'http://127.0.0.1:8086/visualization/', headless:true, reducedMotion:'reduce'},
  projects:[320,390,768,1440].map(width=>({name:String(width),use:{viewport:{width,height:900}}})),
});
