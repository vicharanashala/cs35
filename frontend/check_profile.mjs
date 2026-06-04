import puppeteer from 'puppeteer-core';
import { launch } from 'chrome-launcher';

(async () => {
  try {
    const chrome = await launch({ chromeFlags: ['--headless'] });
    const browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${chrome.port}`
    });
    const page = await browser.newPage();
    
    // We only care about React errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:5173/profile', { waitUntil: 'domcontentloaded' });
    
    // Wait a bit to let React render
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.disconnect();
    await chrome.kill();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
