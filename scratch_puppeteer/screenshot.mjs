import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: "new"
  });
  const page = await browser.newPage();
  
  // Set viewport for desktop
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  console.log('Navigating to login page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  
  // Switch to login form
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const toggleBtn = btns.find(b => b.textContent === 'Login');
    if (toggleBtn) toggleBtn.click();
  });
  
  // Wait a moment for React to render the login form
  await new Promise(r => setTimeout(r, 500));
  
  await page.screenshot({ path: 'login_page.png', fullPage: true });
  console.log('Saved login_page.png');
  
  // Log in as thiveshams
  console.log("Logging in...");
  // Since the default page is Register, we must click 'Login' to switch to the login form
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const switchBtn = btns.find(b => b.textContent.includes('Login') && !b.className.includes('btn-primary'));
    if (switchBtn) switchBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Find the username input in the login form (placeholder "your username")
  await page.type('input[placeholder="your username"]', 'thiveshams');
  await page.type('input[type="password"]', 'thivesha');
  
  // Click the Login button
  await Promise.all([
    page.click('.btn-primary'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
  ]);
  
  // Wait for navigation after login (wait for the navbar to show the user's avatar)
  await page.waitForSelector('button[aria-label="Open profile menu"]', { timeout: 10000 }).catch(e => console.log(e));
  
  console.log('Taking screenshot of home page...');
  await page.screenshot({ path: 'home_page.png', fullPage: true });
  console.log('Saved home_page.png');

  await browser.close();
  console.log('Done.');
})();
