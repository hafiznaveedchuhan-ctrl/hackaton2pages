import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = './test-screenshots';

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, filename) {
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`✓ Screenshot saved: ${filename}`);
  return filepath;
}

async function testAppFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n🧪 STARTING FULL APP TESTING\n');

    // TEST 1: HOME PAGE
    console.log('📍 TEST 1: HOME PAGE');
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '01-home-page.png');

    const homeTitle = await page.title();
    console.log(`✓ Page title: ${homeTitle}`);
    const heroText = await page.textContent('h1');
    console.log(`✓ Hero text: ${heroText?.substring(0, 50)}...`);

    // TEST 2: NAVIGATE TO SIGNUP
    console.log('\n📍 TEST 2: SIGNUP PAGE');
    await page.click('a:has-text("Get Started")');
    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '02-signup-page.png');

    const signupTitle = await page.textContent('h2');
    console.log(`✓ Signup page loaded: ${signupTitle}`);

    // TEST 3: FILL SIGNUP FORM
    console.log('\n📍 TEST 3: FILL SIGNUP FORM');
    await page.fill('input[placeholder*="name" i], input[placeholder*="Name" i], input:nth-of-type(1)', 'Test User');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]:nth-of-type(1)', 'TestPass123');
    await page.fill('input[type="password"]:nth-of-type(2)', 'TestPass123');

    console.log('✓ Form filled with test data');
    await takeScreenshot(page, '03-signup-form-filled.png');

    // TEST 4: SUBMIT SIGNUP
    console.log('\n📍 TEST 4: SUBMIT SIGNUP FORM');
    await page.click('button:has-text("Sign Up"), button:has-text("sign up"), button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(2000);

    // Check for success message or errors
    const successMsg = await page.textContent('p:has-text("success"), p:has-text("Success")').catch(() => null);
    const errorMsg = await page.textContent('p:has-text("error"), p:has-text("Error")').catch(() => null);

    console.log(`✓ Form submitted`);
    if (successMsg) console.log(`✓ Success message: ${successMsg}`);
    if (errorMsg) console.log(`⚠ Error message: ${errorMsg}`);

    await takeScreenshot(page, '04-signup-response.png');

    // TEST 5: NAVIGATE TO SIGNIN
    console.log('\n📍 TEST 5: SIGNIN PAGE');
    if (await page.locator('a:has-text("Sign in")').isVisible().catch(() => false)) {
      await page.click('a:has-text("Sign in")');
    } else {
      await page.goto(`${BASE_URL}/signin`);
    }

    await page.waitForLoadState('domcontentloaded');
    await takeScreenshot(page, '05-signin-page.png');

    const signinTitle = await page.textContent('h2');
    console.log(`✓ Signin page loaded: ${signinTitle}`);

    // TEST 6: LOGIN WITH TEST CREDENTIALS
    console.log('\n📍 TEST 6: LOGIN');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'TestPass123');

    console.log('✓ Login form filled');
    await takeScreenshot(page, '06-signin-form-filled.png');

    // Submit login
    await page.click('button:has-text("Sign In"), button:has-text("sign in"), button[type="submit"]');

    // Wait for redirect or response
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`✓ Current URL: ${currentUrl}`);

    await takeScreenshot(page, '07-after-login.png');

    // TEST 7: CHECK IF AUTHENTICATED
    console.log('\n📍 TEST 7: CHECK AUTHENTICATION');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userId = await page.evaluate(() => localStorage.getItem('userId'));

    if (token) {
      console.log(`✓ Token stored in localStorage`);
      console.log(`✓ User ID: ${userId}`);
    } else {
      console.log(`⚠ No token found in localStorage`);
    }

    // TEST 8: NAVIGATE TO CHAT
    if (currentUrl.includes('dashboard')) {
      console.log('\n📍 TEST 8: NAVIGATE TO CHAT');
      await page.click('a:has-text("Chat"), a:has-text("AI")');
      await page.waitForLoadState('domcontentloaded');
      await takeScreenshot(page, '08-chat-page.png');
    }

    // TEST 9: BACKEND CONNECTIVITY
    console.log('\n📍 TEST 9: TEST BACKEND API');
    const apiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:8000/api/health', { method: 'GET' });
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log(`✓ Backend API check: ${JSON.stringify(apiResponse)}`);

    console.log('\n✅ TESTING COMPLETE\n');
    console.log(`📸 Screenshots saved to: ${path.resolve(SCREENSHOT_DIR)}`);

  } catch (error) {
    console.error('\n❌ ERROR DURING TESTING:');
    console.error(error.message);
    await takeScreenshot(page, '99-error-screenshot.png');
  } finally {
    await context.close();
    await browser.close();
  }
}

testAppFlow().catch(console.error);
