const { chromium } = require('playwright');

const GITHUB_PAGES_URL = 'https://hafiznaveedchuhan-ctrl.github.io/hackaton2pages/';

async function testLiveGitHubPages() {
  let browser;

  try {
    console.log('🔍 Testing LIVE GitHub Pages URL...\n');
    console.log(`📍 Target: ${GITHUB_PAGES_URL}\n`);

    browser = await chromium.launch();
    const page = await browser.newPage();

    // Capture all network requests and responses
    const failedRequests = [];
    const successfulRequests = [];

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      } else {
        successfulRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    // Capture console messages
    const consoleLogs = {
      errors: [],
      warnings: [],
      logs: [],
    };

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleLogs.errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleLogs.warnings.push(msg.text());
      } else {
        consoleLogs.logs.push(msg.text());
      }
    });

    // Test 1: Load homepage
    console.log('📄 Test 1: Loading homepage...');
    const response = await page.goto(GITHUB_PAGES_URL, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`   Response Status: ${response?.status()}`);
    console.log(`   Page URL: ${page.url()}\n`);

    if (response?.status() === 404) {
      console.log('❌ CRITICAL: Homepage returned 404!');
      console.log('   This means GitHub Pages is not serving index.html\n');
    } else if (response?.status() === 200) {
      console.log('✅ Homepage loaded (200 OK)\n');
    }

    // Test 2: Check page content
    console.log('📄 Test 2: Checking page content...');
    const pageTitle = await page.title();
    console.log(`   Page Title: ${pageTitle}`);

    const heading = await page.locator('h1').first();
    const headingText = await heading.textContent();
    console.log(`   Main Heading: ${headingText}\n`);

    // Test 3: Check for 404 errors in console
    console.log('📄 Test 3: Checking for loading errors...');
    if (consoleLogs.errors.length > 0) {
      console.log(`   ⚠️  Found ${consoleLogs.errors.length} console errors:`);
      consoleLogs.errors.forEach((err) => {
        console.log(`      - ${err}`);
      });
    } else {
      console.log('   ✅ No console errors');
    }
    console.log();

    // Test 4: Check failed network requests
    console.log('📄 Test 4: Checking failed network requests...');
    if (failedRequests.length > 0) {
      console.log(`   ❌ Found ${failedRequests.length} failed requests:\n`);
      failedRequests.forEach((req) => {
        console.log(`   ${req.status} ${req.statusText}`);
        console.log(`   └─ ${req.url}\n`);
      });
    } else {
      console.log('   ✅ All network requests successful\n');
    }

    // Test 5: Check for specific assets
    console.log('📄 Test 5: Checking critical assets...');
    const cssFiles = successfulRequests.filter((r) => r.url.includes('.css'));
    const jsFiles = successfulRequests.filter((r) => r.url.includes('.js'));

    console.log(`   CSS Files: ${cssFiles.length} loaded`);
    console.log(`   JS Files: ${jsFiles.length} loaded\n`);

    // Test 6: Try navigation links
    console.log('📄 Test 6: Testing navigation...');
    const signupBtn = await page.locator('a[href*="signup"]').first();
    if (await signupBtn.isVisible()) {
      console.log('   ✅ Sign Up button visible');
      await signupBtn.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      console.log(`   After click - URL: ${page.url()}`);

      const signupResponse = await page.goto(page.url(), { waitUntil: 'networkidle', timeout: 10000 });
      console.log(`   Sign Up page status: ${signupResponse?.status()}\n`);
    }

    // Final summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 LIVE GITHUB PAGES TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (failedRequests.length > 0 || response?.status() !== 200) {
      console.log('❌ ISSUE DETECTED:\n');
      if (response?.status() === 404) {
        console.log('   🔴 Homepage returning 404 - GitHub Pages not serving files');
        console.log('      Possible causes:');
        console.log('      1. Repository settings - GitHub Pages not enabled');
        console.log('      2. Deploy branch - Check "main" or "master" in settings');
        console.log('      3. Output directory - Should be "root" or ".nojekyll" missing');
        console.log();
      }
      if (failedRequests.length > 0) {
        console.log(`   🔴 ${failedRequests.length} network errors detected`);
        console.log('      Check URLs below for 404s or CORS issues\n');
      }
    } else {
      console.log('✅ All checks passed! GitHub Pages working correctly\n');
    }

    console.log('📍 Successful Requests:', successfulRequests.length);
    console.log('❌ Failed Requests:', failedRequests.length);
    console.log('⚠️  Console Errors:', consoleLogs.errors.length);
    console.log();

    await browser.close();

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (browser) await browser.close();
  }
}

testLiveGitHubPages();
