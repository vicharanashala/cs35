/**
 * AskSam E2E QA Audit
 * Headless Microsoft Edge on Windows
 * Runs smoke checks across key routes, captures screenshots, writes qa_report.json
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = join(__dirname, 'qa_report.json');
const SCREENSHOTS_DIR = join(__dirname, 'screenshots');
const API_BASE = 'http://localhost:3000';

const ROUTES = [
  { path: '/',                    label: 'HomePage',           waitFor: '#root' },
  { path: '/login',               label: 'LoginPage',          waitFor: 'form' },
  { path: '/faqs',                label: 'FaqsPage',           waitFor: '#root' },
  { path: '/ask',                 label: 'AskPage',            waitFor: '#root' },
  { path: '/queue',               label: 'QueuePage',          waitFor: '#root' },
  { path: '/my-questions',        label: 'MyQuestionsPage',    waitFor: '#root' },
  { path: '/profile',             label: 'ProfilePage',        waitFor: '#root' },
  { path: '/notifications',       label: 'NotificationsPage',  waitFor: '#root' },
  { path: '/admin',               label: 'AdminPage',          waitFor: '#root' },
];

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const results = [];
let consoleErrors = [];
let browser;

async function run() {
  console.log('🚀 Launching headless Edge...');

  browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  for (const route of ROUTES) {
    const page = await context.newPage();
    const errors = [];
    const warnings = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    page.on('pageerror', (err) => {
      errors.push(`[pageerror] ${err.message}`);
    });

    const screenshotPath = join(SCREENSHOTS_DIR, `${route.label}.png`);

    try {
      const response = await page.goto(`http://localhost:5173${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      const status = response?.status() ?? 0;
      const ok = status >= 200 && status < 400;

      // Wait for rendered content
      await page.waitForSelector(route.waitFor, { timeout: 8000 }).catch(() => null);

      await page.screenshot({ path: screenshotPath, fullPage: true });

      results.push({
        route: route.path,
        label: route.label,
        status,
        ok,
        screenshot: screenshotPath,
        errors,
        warnings,
      });

      console.log(`${ok ? '✅' : '❌'} ${route.label} (HTTP ${status}) — ${errors.length} console errors`);
    } catch (err) {
      results.push({
        route: route.path,
        label: route.label,
        status: 0,
        ok: false,
        screenshot: screenshotPath,
        errors: [`[fatal] ${err.message}`],
        warnings: [],
      });
      console.log(`❌ ${route.label} — FAILED: ${err.message}`);
    }

    await page.close();
  }

  // API smoke test
  try {
    const apiPage = await context.newPage();
    const r = await apiPage.goto(`${API_BASE}/faqs`, { timeout: 10000 });
    results.push({
      route: '/faqs',
      label: 'API_FAQs',
      status: r?.status() ?? 0,
      ok: (r?.status() ?? 0) < 400,
      screenshot: null,
      errors: [],
      warnings: [],
    });
    console.log(`✅ API /faqs (HTTP ${r?.status()})`);
    await apiPage.close();
  } catch (err) {
    results.push({ route: '/api/faqs', label: 'API_FAQs', status: 0, ok: false, errors: [err.message], warnings: [] });
    console.log(`❌ API /faqs — ${err.message}`);
  }

  await browser.close();

  // Summary
  const total = results.length;
  const passed = results.filter(r => r.ok && r.errors.length === 0).length;
  const failed = total - passed;

  const report = {
    timestamp: new Date().toISOString(),
    total,
    passed,
    failed,
    consoleErrorsCount: results.reduce((s, r) => s + r.errors.length, 0),
    results,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n📊 QA Report written → ${REPORT_PATH}`);
  console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
  console.log(`Total console errors: ${report.consoleErrorsCount}`);

  if (failed > 0 || report.consoleErrorsCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('💥 QA audit crashed:', err);
  if (browser) browser.close().catch(() => {});
  process.exit(1);
});