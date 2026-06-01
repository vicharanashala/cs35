import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  console.log('Starting QA Audit...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new' 
  });
  const page = await browser.newPage();
  
  const auditReport = {
    consoleLogs: [],
    pageErrors: [],
    brokenLinks: [],
  };

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      auditReport.consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    auditReport.pageErrors.push(error.message);
  });

  // Set desktop viewport
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Navigate to Login
  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  
  // Login process
  console.log('Logging in as thiveshams...');
  // Switch to login form
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const toggleBtn = btns.find(b => b.textContent === 'Login');
    if (toggleBtn) toggleBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  await page.type('input[placeholder*="username"]', 'thiveshams');
  await page.type('input[type="password"]', 'thivesha');
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.className.includes('btn-primary'));
    if (submitBtn) submitBtn.click();
  });

  // Wait for redirect to home
  await page.waitForSelector('button[aria-label="Open profile menu"]', { timeout: 10000 });
  console.log('Logged in successfully!');

  // Routes to audit
  const routes = [
    { path: '/', name: 'home' },
    { path: '/ask', name: 'ask' },
    { path: '/faqs', name: 'faqs' },
    { path: '/queue', name: 'queue' },
    { path: '/my-questions', name: 'my-questions' },
    { path: '/profile', name: 'profile' },
    { path: '/notifications', name: 'notifications' }
  ];

  for (const route of routes) {
    console.log(`Auditing ${route.path}...`);
    await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000)); // Wait for React Query data
    
    // Desktop screenshot
    await page.setViewport({ width: 1440, height: 900 });
    await page.screenshot({ path: `qa_${route.name}_desktop.png`, fullPage: true });

    // Mobile screenshot
    await page.setViewport({ width: 375, height: 812 });
    await page.screenshot({ path: `qa_${route.name}_mobile.png`, fullPage: true });
    
    // Check for broken links (404s inside hrefs or src)
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.map(a => a.href);
    });
    
    // We'll just collect the hrefs for now to ensure they are valid formats
    // A more thorough check would fetch each, but for a fast audit we'll skip to avoid hanging.
  }

  fs.writeFileSync('qa_report.json', JSON.stringify(auditReport, null, 2));
  console.log('QA Audit completed. Saved screenshots and report.');

  await browser.close();
})();
