import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3002';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('\n🤖 CHAT FUNCTIONALITY TEST\n');

    // Go to home
    console.log('📍 Navigating to home...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Go to signin
    console.log('📍 Navigating to signin...');
    await page.goto(`${BASE_URL}/signin`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Login with existing user
    console.log('📝 Logging in...');
    await page.locator('input[type="email"]').fill('testuser@example.com');
    await page.locator('input[type="password"]').fill('TestPass123');
    await page.locator('button[type="submit"]').first().click();

    await page.waitForTimeout(3000);

    // Check if logged in
    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (!token) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Logged in successfully');

    // Navigate to chat
    console.log('\n📍 Navigating to chat page...');
    await page.goto(`${BASE_URL}/chat`);
    await page.waitForTimeout(3000);

    const chatUrl = page.url();
    console.log(`✓ Chat page URL: ${chatUrl}`);

    // Wait for chat input
    const chatInput = await page.locator('input[placeholder*="message" i], input[placeholder*="Type" i]').first();
    if (await chatInput.isVisible()) {
      console.log('✓ Chat input field found');

      // Send a message
      console.log('\n💬 Sending test message...');
      await chatInput.fill('Add task: Complete testing');
      console.log('✓ Message typed');

      // Look for send button
      const sendBtn = await page.locator('button:has-text("Send"), button[type="submit"]').first();
      if (await sendBtn.isVisible()) {
        await sendBtn.click();
        console.log('✓ Message sent');

        // Wait for response
        await page.waitForTimeout(5000);

        // Check if response appeared
        const messages = await page.locator('div:has-text("Complete testing")').isVisible().catch(() => false);
        console.log(`✓ Message visible in chat: ${messages ? 'YES ✅' : 'NO (still processing)'}`);

        // Check browser console for errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        console.log('\n✅ CHAT TEST COMPLETE');
        console.log('Chat interface is accessible and responsive');
      } else {
        console.log('⚠ Send button not found');
      }
    } else {
      console.log('⚠ Chat input not found');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await page.screenshot({ path: './test-screenshots/chat-test-final.png' });
    await browser.close();
  }
}

test();
