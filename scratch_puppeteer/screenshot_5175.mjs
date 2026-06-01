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
  
  console.log('Navigating to login page on Port 5175...');
  await page.goto('http://localhost:5175/login', { waitUntil: 'networkidle0' });
  
  // Switch to login form
  console.log('Switching to login form...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const toggleBtn = btns.find(b => b.textContent === 'Login');
    if (toggleBtn) toggleBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 800));
  
  await page.screenshot({ path: 'login_page_5175.png', fullPage: true });
  console.log('Saved login_page_5175.png');
  
  // Find the username input and type credentials
  console.log('Typing credentials...');
  await page.type('input[placeholder="your username"]', 'thiveshams');
  await page.type('input[type="password"]', 'thivesha');
  
  // Click the Login button
  console.log('Clicking login submit...');
  await Promise.all([
    page.click('.btn-primary'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
  ]);
  
  // Wait for profile avatar to appear (successful login)
  console.log('Waiting for successful redirect to home...');
  await page.waitForSelector('button[aria-label="Open profile menu"]', { timeout: 10000 });
  
  console.log('Taking screenshot of home page...');
  await page.screenshot({ path: 'home_page_5175.png', fullPage: true });
  console.log('Saved home_page_5175.png');

  await browser.close();
  console.log('Done.');
})();
