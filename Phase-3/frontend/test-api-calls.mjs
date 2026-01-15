import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3002';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen to all API requests
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('localhost:8000')) {
      console.log(`\n🔗 API RESPONSE: ${response.status()} ${url}`);
      try {
        const text = await response.text();
        console.log(`📄 Body: ${text.substring(0, 200)}`);
      } catch (e) {
        console.log('(binary response)');
      }
    }
  });

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('localhost:8000')) {
      console.log(`\n📤 API REQUEST: ${request.method()} ${url}`);
    }
  });

  try {
    console.log('🌐 Navigating to signup...');
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('\n📝 Filling form...');
    await page.locator('input').nth(0).fill('APITest User');
    await page.locator('input[type="email"]').fill('apitest@test.com');
    const passwords = await page.locator('input[type="password"]').all();
    await passwords[0].fill('APIPass123');
    await passwords[1].fill('APIPass123');

    console.log('✅ Clicking submit button...');
    await page.locator('button[type="submit"]').first().click();

    console.log('\n⏳ Waiting for response...');
    await page.waitForTimeout(5000);

    // Check what the page shows
    const pageUrl = page.url();
    console.log(`\n📍 Current URL: ${pageUrl}`);

    const modal = await page.locator('text=Account Created').isVisible().catch(() => false);
    console.log(`✓ Success modal visible: ${modal}`);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log(`✓ Token in localStorage: ${token ? 'YES ✅' : 'NO ❌'}`);

    if (token) {
      console.log('\n✅ SIGNUP SUCCESSFUL!');
    } else {
      const errorText = await page.textContent('p:has-text("error"), p:has-text("Error")').catch(() => null);
      if (errorText) {
        console.log(`\n❌ ERROR: ${errorText}`);
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await page.screenshot({ path: './test-screenshots/api-test-final.png' });
    await browser.close();
  }
}

test();
