import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',timeout:60000,use:{baseURL:'http://127.0.0.1:8085',headless:true,reducedMotion:'reduce'},projects:[320,390,768,1024,1440].map(width=>({name:String(width),use:{viewport:{width,height:1000}}}))});
