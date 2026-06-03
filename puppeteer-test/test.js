const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const consoleErrors = [];
  
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  // Set auth state before navigating
  await context.addInitScript(() => {
    localStorage.setItem('authToken', 'demo-token');
    localStorage.setItem('authUser', JSON.stringify({
      _id: 'user-1',
      username: 'test_user_3',
      role: 'student',
      name: 'Test User'
    }));
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML?.substring(0, 500));
  
  console.log('\n--- BODY TEXT (first 300 chars) ---');
  console.log(bodyText.substring(0, 300));
  console.log('\n--- ROOT HTML (first 500 chars) ---');
  console.log(rootHTML);
  console.log('\n--- ERRORS TOTAL:', errors.length, '---');
  console.log('\n--- CONSOLE ERRORS TOTAL:', consoleErrors.length, '---');
  
  await browser.close();
})();
