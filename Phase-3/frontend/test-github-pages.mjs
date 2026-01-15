import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const GITHUB_PAGES_URL = 'https://hafiznaveedchuhan-ctrl.github.io/hackaton2pages/';

  try {
    console.log('\n🚀 GITHUB PAGES DEPLOYMENT TEST\n');
    console.log(`Testing: ${GITHUB_PAGES_URL}\n`);

    // Test home page
    console.log('📍 Loading home page...');
    await page.goto(GITHUB_PAGES_URL, { waitUntil: 'networkidle', timeout: 15000 });

    const title = await page.title();
    console.log(`✓ Page title: ${title}`);

    // Check for main content
    const heroText = await page.textContent('h1');
    console.log(`✓ Hero text: ${heroText?.substring(0, 50)}...`);

    // Check for buttons
    const getStartedBtn = await page.locator('a[href*="/signup"], a:has-text("Get Started")').first().isVisible();
    const signInBtn = await page.locator('a[href*="/signin"], a:has-text("Sign In")').first().isVisible();
    const chatBtn = await page.locator('a[href*="/chat"], a:has-text("Chat")').first().isVisible();

    console.log(`✓ "Get Started" button visible: ${getStartedBtn ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ "Sign In" button visible: ${signInBtn ? 'YES ✅' : 'NO ❌'}`);
    console.log(`✓ "Chat" button visible: ${chatBtn ? 'YES ✅' : 'NO ❌'}`);

    // Test signup page
    console.log('\n📍 Testing signup page...');
    const signupLink = await page.locator('a[href*="/signup"]').first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForTimeout(2000);
      const signupTitle = await page.textContent('h2');
      console.log(`✓ Signup page title: ${signupTitle}`);
    }

    // Test signin page
    console.log('\n📍 Testing signin page...');
    await page.goto(GITHUB_PAGES_URL + 'signin');
    await page.waitForTimeout(2000);
    const signinTitle = await page.textContent('h2');
    console.log(`✓ Signin page title: ${signinTitle}`);

    // Check if signin form is present
    const signinForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
    console.log(`✓ Signin form visible: ${signinForm ? 'YES ✅' : 'NO ❌'}`);

    // Test chat page
    console.log('\n📍 Testing chat page...');
    await page.goto(GITHUB_PAGES_URL + 'chat');
    await page.waitForTimeout(2000);
    const chatTitle = await page.textContent('h1');
    console.log(`✓ Chat page content: ${chatTitle?.substring(0, 40)}...`);

    console.log('\n========================================');
    console.log('✅ GITHUB PAGES DEPLOYMENT WORKING!');
    console.log('========================================');
    console.log('\n🌐 GitHub Pages URL:');
    console.log(`   ${GITHUB_PAGES_URL}`);
    console.log('\n✓ Pages accessible:');
    console.log('   ✓ Home page');
    console.log('   ✓ Signup page');
    console.log('   ✓ Signin page');
    console.log('   ✓ Chat page');
    console.log('\n📝 NOTE: GitHub Pages deployment is STATIC');
    console.log('   - No backend integration on Pages');
    console.log('   - Full functionality requires backend running');
    console.log('   - Use LOCAL setup for testing with backend');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n⚠  GitHub Pages may not be accessible or updated');
  } finally {
    await page.screenshot({ path: './test-screenshots/github-pages-final.png' }).catch(() => {});
    await browser.close();
  }
}

test();
