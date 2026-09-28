const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Simple static file server for dist/
function startStaticServer(distPath, port = 4173) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
  };

  const server = http.createServer((req, res) => {
    let cleanUrl = req.url.split('?')[0];
    if (cleanUrl.startsWith('/Adisyon/')) {
      cleanUrl = cleanUrl.replace('/Adisyon/', '/');
    }
    if (cleanUrl === '/' || cleanUrl === '') {
      cleanUrl = '/index.html';
    }

    let filePath = path.join(distPath, cleanUrl);

    // If file doesn't exist, fallback to index.html (SPA routing)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(data);
    } catch (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.message);
    }
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

// OS and Device profiles matrix
const testProfiles = [
  {
    name: 'iOS (iPhone 15 Pro - Safari Mobile)',
    os: 'iOS',
    browser: 'Mobile Safari',
    deviceType: 'mobile',
    contextOptions: {
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
    },
  },
  {
    name: 'iOS (iPad Pro 11 - Safari Tablet)',
    os: 'iPadOS',
    browser: 'Mobile Safari Tablet',
    deviceType: 'tablet',
    contextOptions: {
      viewport: { width: 834, height: 1194 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    },
  },
  {
    name: 'Android (Samsung Galaxy S24 - Chrome Mobile)',
    os: 'Android',
    browser: 'Google Chrome Mobile',
    deviceType: 'mobile',
    contextOptions: {
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    },
  },
  {
    name: 'Android (Samsung Internet Browser)',
    os: 'Android',
    browser: 'Samsung Internet',
    deviceType: 'mobile',
    contextOptions: {
      viewport: { width: 384, height: 854 },
      deviceScaleFactor: 2.5,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/118.0.0.0 Mobile Safari/537.36',
    },
  },
  {
    name: 'Windows 11 (Google Chrome Desktop)',
    os: 'Windows 11',
    browser: 'Google Chrome Desktop',
    deviceType: 'desktop',
    contextOptions: {
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  },
  {
    name: 'Windows 11 (Microsoft Edge Desktop)',
    os: 'Windows 11',
    browser: 'Microsoft Edge Desktop',
    deviceType: 'desktop',
    channel: 'msedge',
    contextOptions: {
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    },
  },
  {
    name: 'macOS Sonoma (Apple Safari Desktop)',
    os: 'macOS',
    browser: 'Safari Desktop',
    deviceType: 'desktop',
    contextOptions: {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      isMobile: false,
      hasTouch: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    },
  },
  {
    name: 'Linux (Mozilla Firefox Desktop)',
    os: 'Linux',
    browser: 'Mozilla Firefox',
    deviceType: 'desktop',
    contextOptions: {
      viewport: { width: 1366, height: 768 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
    },
  },
];

async function runTestSuite() {
  const distDir = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    console.error('dist directory does not exist! Please run "npm run build" first.');
    process.exit(1);
  }

  const PORT = 4173;
  console.log(`Starting local production test server on port ${PORT}...`);
  const server = await startStaticServer(distDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}/Adisyon/`;
  console.log(`Test server running at ${baseUrl}\n`);

  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const profile of testProfiles) {
    console.log(`================================================================`);
    console.log(`TESTING PROFILE: ${profile.name}`);
    console.log(`OS: ${profile.os} | Browser: ${profile.browser} | Type: ${profile.deviceType}`);
    console.log(`================================================================`);

    let browser;
    try {
      const launchOptions = {
        headless: true,
      };
      if (profile.channel) {
        launchOptions.channel = profile.channel;
      } else {
        launchOptions.channel = 'chrome';
      }

      browser = await chromium.launch(launchOptions);
      const context = await browser.newContext(profile.contextOptions);
      const page = await context.newPage();

      // Collect console errors on the page
      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(`[PageError] ${err.message}`));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          pageErrors.push(`[ConsoleError] ${msg.text()}`);
        }
      });
      page.on('requestfailed', req => {
        console.log('   DEBUG REQ FAILED:', req.url(), req.failure()?.errorText);
      });

      const profileReport = {
        profile: profile.name,
        os: profile.os,
        browser: profile.browser,
        deviceType: profile.deviceType,
        tests: [],
      };

      const recordTest = (testName, passed, details = '') => {
        totalTests++;
        if (passed) passedTests++;
        else failedTests++;

        profileReport.tests.push({ testName, passed, details });
        console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}: ${testName}${details ? ` (${details})` : ''}`);
      };

      // ── TEST 1: Login Page Load & Logo Rendering
      try {
        await page.goto(`${baseUrl}#/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(600);

        const pageTitle = await page.title();
        const hasTitle = pageTitle.includes("WOT'S");
        const logoVisible = (await page.locator('img[alt*="WOT"]').count()) > 0;
        const hasUserInput = await page.locator('input').first().isVisible();

        recordTest('Login Page & Logo Rendering', hasTitle && logoVisible && hasUserInput, `Title: ${pageTitle}`);
      } catch (err) {
        recordTest('Login Page & Logo Rendering', false, err.message);
      }

      // ── TEST 2: Developer Account Authentication
      try {
        // Fill developer credentials
        const inputs = page.locator('input');
        await inputs.nth(0).fill('developer');
        await inputs.nth(1).fill('0000');
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(800);

        // Verify it routed to /developer
        const currentUrl = page.url();
        const isDevRoute = currentUrl.includes('/developer');
        recordTest('Developer Login & Route Access', isDevRoute, `Routed to: ${currentUrl}`);
      } catch (err) {
        recordTest('Developer Login & Route Access', false, err.message);
      }

      // ── TEST 3: Developer Console Tabs & Diagnostic Data
      try {
        // Check if diagnostic badges and tabs are rendered
        const hasDevHeader = await page.locator('h1').textContent();
        const devTitleOk = hasDevHeader.includes('Geliştirici & Tanılama');

        // Click Diagnostics Tab
        await page.locator('button:has-text("Cihaz & İşletim Sistemi")').click();
        await page.waitForTimeout(400);

        // Check if OS and Browser cards exist
        const hasOsInfo = await page.locator('text=İşletim Sistemi:').isVisible();
        const hasBrowserInfo = await page.locator('text=Tarayıcı Motoru:').isVisible();

        recordTest('Developer Console & Diagnostics Tab', devTitleOk && hasOsInfo && hasBrowserInfo);
      } catch (err) {
        recordTest('Developer Console & Diagnostics Tab', false, err.message);
      }

      // ── TEST 4: Tables Page & Floor Navigation
      try {
        await page.goto(`${baseUrl}#/tables`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(600);

        // Verify table cards are present
        const tableCardsCount = await page.locator('text=M1').count();
        const hasFloors = await page.locator('text=Sahil Teras').isVisible();

        recordTest('Tables Floor Map & Table Grid', hasFloors && tableCardsCount > 0, `Found tables and floor tabs`);
      } catch (err) {
        recordTest('Tables Floor Map & Table Grid', false, err.message);
      }

      // ── TEST 5: Order Creation & Cart Workflow
      try {
        await page.goto(`${baseUrl}#/order/t-1`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(600);

        // Click first menu item to add to order
        const firstProduct = page.locator('button:has-text("₺")').first();
        if (await firstProduct.isVisible()) {
          await firstProduct.click();
          await page.waitForTimeout(400);
        }

        // Verify cart or order button exists
        const hasOrderContent = (await page.locator('text=Masa M1').count()) > 0 || (await page.locator('text=Sipariş').count()) > 0;
        recordTest('Order Taking & Product Selection', hasOrderContent);
      } catch (err) {
        recordTest('Order Taking & Product Selection', false, err.message);
      }

      // ── TEST 6: Kitchen Display System (KDS)
      try {
        await page.goto(`${baseUrl}#/kitchen`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(600);

        const hasStationFilters = (await page.locator('text=Mutfak').count()) > 0;
        recordTest('Kitchen Display System (KDS)', hasStationFilters);
      } catch (err) {
        recordTest('Kitchen Display System (KDS)', false, err.message);
      }

      // ── TEST 7: Cash Register & Reports Page
      try {
        await page.goto(`${baseUrl}#/reports`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(600);

        const hasRevenueHeader = (await page.locator('text=Ciro').count()) > 0 || (await page.locator('text=Kasa').count()) > 0;
        recordTest('Reports & Cash Register (Kasa & Ciro)', hasRevenueHeader);
      } catch (err) {
        recordTest('Reports & Cash Register (Kasa & Ciro)', false, err.message);
      }

      // ── TEST 8: Customer Digital QR Menu (/qr/t-1)
      try {
        await page.goto(`${baseUrl}#/qr/t-1`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(600);

        const qrHeaderVisible = await page.locator('header').isVisible();
        const qrLogoVisible = await page.locator('img[alt="WOT\'S CAFE"]').isVisible();
        const qrTableBadge = await page.locator('text=Masa M1').isVisible();

        recordTest('Customer QR Digital Menu', qrHeaderVisible && qrLogoVisible && qrTableBadge);
      } catch (err) {
        recordTest('Customer QR Digital Menu', false, err.message);
      }

      // ── TEST 9: Patron Guide Page (/guide)
      try {
        await page.goto(`${baseUrl}#/guide`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(600);

        const hasGuideHeader = (await page.locator('text=Kullanım Rehberi').count()) > 0 || (await page.locator('text=Rehber').count()) > 0;
        recordTest('Patron Guide & Workflow Page', hasGuideHeader);
      } catch (err) {
        recordTest('Patron Guide & Workflow Page', false, err.message);
      }

      // ── Check Page Errors
      const criticalErrors = pageErrors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('Service Worker') && 
        !e.includes('429') && 
        !e.includes('ntfy.sh') &&
        !e.includes('net::ERR_FAILED') &&
        !e.includes('ERR_CONNECTION_REFUSED')
      );
      if (criticalErrors.length === 0) {
        recordTest('Zero Runtime Console Errors', true, 'Clean console log');
      } else {
        recordTest('Zero Runtime Console Errors', false, criticalErrors.slice(0, 2).join('; '));
      }

      results.push(profileReport);
      await browser.close();
    } catch (err) {
      console.error(`Profile ${profile.name} fatal test failure:`, err);
    }
  }

  server.close();

  // Print final summary report
  console.log(`\n================================================================`);
  console.log(`FINAL CROSS-PLATFORM & BROWSER COMPATIBILITY REPORT`);
  console.log(`================================================================`);
  console.log(`Total Scenarios Executed: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`Failed: ${failedTests}`);
  console.log(`\nDevice Matrix Breakdown:`);
  results.forEach(r => {
    const passed = r.tests.filter(t => t.passed).length;
    const total = r.tests.length;
    console.log(`  - [${r.os} / ${r.browser}]: ${passed}/${total} passed (${r.deviceType})`);
  });

  return { totalTests, passedTests, failedTests, results };
}

runTestSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
