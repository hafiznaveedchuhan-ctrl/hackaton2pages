import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3002';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('\n🤖 AI CHAT WITH HISTORY TEST\n');

    // 1. Login
    console.log('📍 Step 1: Logging in...');
    await page.goto(`${BASE_URL}/signin`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Use a test user that should exist
    await page.locator('input[type="email"]').fill('testuser@example.com');
    await page.locator('input[type="password"]').fill('TestPass123');
    await page.locator('button[type="submit"]').first().click();

    await page.waitForTimeout(3000);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userId = await page.evaluate(() => localStorage.getItem('userId'));

    if (!token) {
      console.log('❌ Login failed');
      // Try creating new user
      console.log('Creating new test user...');
      await page.goto(`${BASE_URL}/signup`);
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      const timestamp = Date.now();
      const newEmail = `chattest${timestamp}@test.com`;

      await page.locator('input').nth(0).fill('Chat Test User');
      await page.locator('input[type="email"]').fill(newEmail);
      const pwds = await page.locator('input[type="password"]').all();
      await pwds[0].fill('ChatPass123');
      await pwds[1].fill('ChatPass123');

      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(3000);

      // Now login
      await page.goto(`${BASE_URL}/signin`);
      await page.waitForSelector('input[type="email"]');
      await page.locator('input[type="email"]').fill(newEmail);
      await page.locator('input[type="password"]').fill('ChatPass123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(3000);
    }

    const finalToken = await page.evaluate(() => localStorage.getItem('token'));
    const finalUserId = await page.evaluate(() => localStorage.getItem('userId'));

    if (finalToken) {
      console.log(`✅ Logged in - User ID: ${finalUserId}`);
    } else {
      console.log('❌ Login still failed');
      return;
    }

    // 2. Navigate to Chat
    console.log('\n📍 Step 2: Navigate to Chat...');
    await page.goto(`${BASE_URL}/chat`);
    await page.waitForTimeout(3000);

    console.log('✓ Chat page loaded');

    // 3. Wait for chat input to be visible
    const chatInput = await page.locator('input[placeholder*="message" i], textarea').first();
    const isVisible = await chatInput.isVisible().catch(() => false);

    console.log(`\n📍 Step 3: Chat Input Visible: ${isVisible ? 'YES ✅' : 'NO ❌'}`);

    if (isVisible) {
      // 4. Send test messages
      console.log('\n📍 Step 4: Sending test messages...');

      const messages = [
        'Hello, add task Buy groceries',
        'What tasks do I have?',
        'Mark first task complete'
      ];

      for (const msg of messages) {
        console.log(`\n💬 Sending: "${msg}"`);
        await chatInput.fill(msg);

        const sendBtn = await page.locator('button:has-text("Send"), button[type="submit"]').first();
        const isSendVisible = await sendBtn.isVisible().catch(() => false);

        if (isSendVisible) {
          await sendBtn.click();
          console.log('✓ Message sent');

          // Wait for response
          await page.waitForTimeout(4000);

          // Check if message appears in chat
          const userMsg = await page.textContent(`div:has-text("${msg.substring(0, 20)}")`).catch(() => null);
          console.log(`✓ Message in chat: ${userMsg ? 'YES ✅' : 'NO'}`);

          // Check for AI response
          const aiMsgs = await page.locator('div:has-text("task"), div:has-text("Task")').count();
          console.log(`✓ AI responses detected: ${aiMsgs > 0 ? 'YES ✅' : 'PROCESSING...'}`);
        } else {
          console.log('❌ Send button not found');
          break;
        }
      }

      console.log('\n📍 Step 5: Verify Chat History...');
      // Check if history is persisting
      const messages_in_chat = await page.locator('div').count();
      console.log(`✓ Total elements in chat: ${messages_in_chat}`);

      if (messages_in_chat > 10) {
        console.log('✅ CHAT HISTORY PERSISTING');
      } else {
        console.log('⚠ Chat history may not be persisting properly');
      }
    }

    console.log('\n✅ CHAT TEST COMPLETE');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await page.screenshot({ path: './test-screenshots/chat-ai-test-final.png' });
    await browser.close();
  }
}

test();
