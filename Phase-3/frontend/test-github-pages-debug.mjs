import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const GITHUB_URL = 'https://hafiznaveedchuhan-ctrl.github.io/hackaton2pages/';

  try {
    console.log('\n🔍 GITHUB PAGES DEBUGGING\n');

    // Listen to all network errors
    page.on('response', (response) => {
      if (!response.ok()) {
        console.log(`⚠️  Failed: ${response.status()} ${response.url()}`);
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`🐛 ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });

    console.log(`🌐 Loading: ${GITHUB_URL}`);
    await page.goto(GITHUB_URL, { timeout: 20000, waitUntil: 'domcontentloaded' });

    console.log('✓ Page loaded');

    // Check page title
    const title = await page.title();
    console.log(`✓ Title: ${title}`);

    // Check if main content exists
    const mainContent = await page.locator('main, [role="main"]').isVisible().catch(() => false);
    console.log(`✓ Main content visible: ${mainContent ? 'YES' : 'NO'}`);

    // Check for hero text
    const hero = await page.textContent('h1').catch(() => null);
    console.log(`✓ Hero text: ${hero ? 'YES - ' + hero.substring(0, 40) : 'NO'}`);

    // Check for buttons
    const btns = await page.locator('button, a[role="button"]').count();
    console.log(`✓ Buttons found: ${btns}`);

    // Check console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForTimeout(3000);

    if (errors.length > 0) {
      console.log('\n⚠️ CONSOLE ERRORS:');
      errors.forEach(e => console.log(`  ${e}`));
    } else {
      console.log('\n✓ No console errors');
    }

    // Try navigating to signup
    console.log('\n📍 Testing navigation to /signup...');
    const signupLink = await page.locator('a[href*="signup"], a:has-text("Get Started")').first().isVisible().catch(() => false);
    console.log(`✓ Signup link visible: ${signupLink ? 'YES' : 'NO'}`);

    if (signupLink) {
      await page.click('a[href*="signup"], a:has-text("Get Started")');
      await page.waitForTimeout(3000);

      const signupUrl = page.url();
      const signupTitle = await page.title();
      console.log(`✓ Navigated to: ${signupUrl}`);
      console.log(`✓ Page title: ${signupTitle}`);

      const signupForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
      console.log(`✓ Signup form visible: ${signupForm ? 'YES ✅' : 'NO ❌'}`);
    }

    console.log('\n✅ GITHUB PAGES DEBUG COMPLETE');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await page.screenshot({ path: './test-screenshots/github-debug-final.png' });
    await browser.close();
  }
}

test();
