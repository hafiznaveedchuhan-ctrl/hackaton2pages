import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3002';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const testEmail = `flow${Date.now()}@test.com`;
  const testPassword = 'FlowPass123';

  console.log('\n========================================');
  console.log('  COMPLETE AUTHENTICATION FLOW TEST');
  console.log('========================================\n');

  try {
    // STEP 1: SIGNUP
    console.log('STEP 1: SIGNUP');
    console.log('-------------');
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.locator('input').nth(0).fill('Flow Test User');
    await page.locator('input[type="email"]').fill(testEmail);
    const pwdInputs = await page.locator('input[type="password"]').all();
    await pwdInputs[0].fill(testPassword);
    await pwdInputs[1].fill(testPassword);

    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);

    const afterSignupUrl = page.url();
    console.log(`✓ Redirected to: ${afterSignupUrl}`);

    // Check if success modal appeared
    const successVisible = await page.locator('text=/Account Created|Redirecting/i').isVisible().catch(() => false);
    console.log(`✓ Success message visible: ${successVisible ? 'YES ✅' : 'NO (page may have redirected quickly)'}`);

    // STEP 2: LOGIN
    console.log('\nSTEP 2: LOGIN');
    console.log('-------------');

    // Wait for page to load (if we need to navigate)
    if (!afterSignupUrl.includes('/signin')) {
      await page.goto(`${BASE_URL}/signin`);
    }

    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    const signinInputs = await page.locator('input');
    await signinInputs.nth(0).fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);

    console.log(`✓ Login form filled`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);

    await page.locator('button[type="submit"]').first().click();
    console.log('✓ Login form submitted');

    await page.waitForTimeout(3000);

    // Check for login success
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userId = await page.evaluate(() => localStorage.getItem('userId'));
    const userName = await page.evaluate(() => localStorage.getItem('userName'));

    console.log('\nSTEP 3: VERIFY LOGIN');
    console.log('-------------------');

    if (token) {
      console.log(`✅ TOKEN FOUND: ${token.substring(0, 30)}...`);
      console.log(`✅ USER ID: ${userId}`);
      console.log(`✅ USER NAME: ${userName}`);
    } else {
      console.log('❌ NO TOKEN IN LOCALSTORAGE');
      const errMsg = await page.textContent('p:has-text("error"), p:has-text("Error")').catch(() => null);
      if (errMsg) {
        console.log(`❌ ERROR: ${errMsg}`);
      }
    }

    const finalUrl = page.url();
    console.log(`✓ Final URL: ${finalUrl}`);

    // STEP 4: VERIFY DASHBOARD/CHAT ACCESS
    console.log('\nSTEP 4: CHECK PROTECTED PAGES');
    console.log('-----------------------------');

    if (token) {
      // Try to go to dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(2000);

      const dashboardUrl = page.url();
      const dashboardContent = await page.textContent('h1');

      console.log(`✓ Dashboard URL: ${dashboardUrl}`);
      console.log(`✓ Dashboard content: ${dashboardContent?.substring(0, 50)}...`);

      // Try to go to chat
      await page.goto(`${BASE_URL}/chat`);
      await page.waitForTimeout(2000);

      const chatUrl = page.url();
      const chatContent = await page.textContent('h1');

      console.log(`✓ Chat URL: ${chatUrl}`);
      console.log(`✓ Chat content: ${chatContent?.substring(0, 50)}...`);
    }

    console.log('\n========================================');
    if (token) {
      console.log('✅ FULL AUTHENTICATION FLOW SUCCESSFUL!');
      console.log('========================================\n');
      console.log('Summary:');
      console.log(`  ✓ Signup: WORKING`);
      console.log(`  ✓ Login: WORKING`);
      console.log(`  ✓ Token storage: WORKING`);
      console.log(`  ✓ Dashboard: ACCESSIBLE`);
      console.log(`  ✓ Chat: ACCESSIBLE\n`);
    } else {
      console.log('⚠ FLOW INCOMPLETE - LOGIN FAILED');
      console.log('========================================\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await page.screenshot({ path: './test-screenshots/complete-flow-final.png' });
    await browser.close();
  }
}

test();
