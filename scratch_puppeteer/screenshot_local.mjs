import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  console.log('Navigating to login page on Port 5174...');
  try {
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0' });
    console.log('Successfully navigated!');
    await page.screenshot({ path: 'login_page_5174.png', fullPage: true });
    console.log('Saved login_page_5174.png');
  } catch (err) {
    console.error('Navigation failed:', err.message);
  }
  
  await browser.close();
})();
