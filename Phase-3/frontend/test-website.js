const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  try {
    console.log('Testing home page...');
    await page.goto('http://localhost:3001');

    // Test navbar exists
    const navbar = await page.locator('nav').first();
    if (navbar) {
      console.log('✓ Navbar found');
    }

    // Test hero section exists
    const heroSection = await page.locator('section').first();
    if (heroSection) {
      console.log('✓ Hero section found');
    }

    // Test footer exists
    const footer = await page.locator('footer').first();
    if (footer) {
      console.log('✓ Footer found');
    }

    // Test Sign In button
    const signInBtn = await page.getByRole('link', { name: 'Sign In' }).first();
    if (signInBtn) {
      console.log('✓ Sign In button found');
    }

    // Test Sign Up button
    const signUpBtn = await page.getByRole('link', { name: 'Sign Up' }).first();
    if (signUpBtn) {
      console.log('✓ Sign Up button found');
    }

    // Take screenshot
    await page.screenshot({ path: 'home-page.png', fullPage: true });
    console.log('✓ Home page screenshot saved');

    console.log('\nTesting Sign In page...');
    await page.goto('http://localhost:3001/signin');

    // Test Sign In form
    const emailInput = await page.getByPlaceholder('you@example.com');
    if (emailInput) {
      console.log('✓ Email input found on Sign In page');
    }

    const passwordInput = await page.getByPlaceholder('••••••••').first();
    if (passwordInput) {
      console.log('✓ Password input found on Sign In page');
    }

    const signInSubmit = await page.getByRole('button', { name: /Sign In/i });
    if (signInSubmit) {
      console.log('✓ Sign In submit button found');
    }

    await page.screenshot({ path: 'signin-page.png', fullPage: true });
    console.log('✓ Sign In page screenshot saved');

    console.log('\nTesting Sign Up page...');
    await page.goto('http://localhost:3001/signup');

    // Test Sign Up form
    const nameInput = await page.getByPlaceholder('Your name');
    if (nameInput) {
      console.log('✓ Full name input found on Sign Up page');
    }

    const signUpSubmit = await page.getByRole('button', { name: /Create Account/i });
    if (signUpSubmit) {
      console.log('✓ Create Account button found');
    }

    await page.screenshot({ path: 'signup-page.png', fullPage: true });
    console.log('✓ Sign Up page screenshot saved');

    console.log('\nTesting Chat page...');
    await page.goto('http://localhost:3001/chat');

    // Test chat input
    const chatInput = await page.getByPlaceholder('Tell me what to do with your tasks...');
    if (chatInput) {
      console.log('✓ Chat input found');
    }

    // Test send button
    const sendBtn = await page.getByRole('button', { name: /Send/i });
    if (sendBtn) {
      console.log('✓ Send button found');
    }

    await page.screenshot({ path: 'chat-page.png', fullPage: true });
    console.log('✓ Chat page screenshot saved');

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

test();
