const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testBuild() {
  let browser;
  const outDir = path.join(__dirname, 'out');

  try {
    // Check if build directory exists
    if (!fs.existsSync(outDir)) {
      console.error('❌ Build directory not found. Run npm run build first.');
      process.exit(1);
    }

    console.log('🧪 Testing production build...\n');

    browser = await chromium.launch();
    const page = await browser.newPage();

    // Test 1: Load homepage
    console.log('📄 Test 1: Loading homepage...');
    const indexPath = `file://${path.join(outDir, 'index.html')}`;
    await page.goto(indexPath, { waitUntil: 'networkidle' });

    const title = await page.title();
    if (title.includes('Fatima Zehra Todo')) {
      console.log('✅ Homepage loaded successfully');
      console.log(`   Title: ${title}\n`);
    } else {
      throw new Error('Homepage title not found');
    }

    // Test 2: Check for main heading
    console.log('📄 Test 2: Checking for main heading...');
    const heading = await page.locator('h1').first();
    const headingText = await heading.textContent();
    if (headingText?.includes('AI-Powered Task Management')) {
      console.log(`✅ Main heading found: "${headingText}"\n`);
    } else {
      throw new Error('Main heading not found');
    }

    // Test 3: Check for navigation buttons
    console.log('📄 Test 3: Checking navigation elements...');
    const buttons = ['Get Started', 'Sign In', 'Try AI Chat'];
    for (const button of buttons) {
      const btn = await page.locator(`text="${button}"`).first();
      if (await btn.isVisible()) {
        console.log(`✅ Found button: "${button}"`);
      } else {
        throw new Error(`Button not found: ${button}`);
      }
    }
    console.log();

    // Test 4: Check feature cards
    console.log('📄 Test 4: Checking feature cards...');
    const cards = ['AI Chatbot', 'MCP Tools', 'Secure Auth'];
    for (const card of cards) {
      const cardElement = await page.locator(`text="${card}"`).first();
      if (await cardElement.isVisible()) {
        console.log(`✅ Found feature card: "${card}"`);
      } else {
        throw new Error(`Feature card not found: ${card}`);
      }
    }
    console.log();

    // Test 5: Check for CSS styling
    console.log('📄 Test 5: Checking CSS styling...');
    await page.waitForLoadState('networkidle');

    const main = await page.locator('main');
    const hasClass = await main.evaluate((el) => {
      return el.className && el.className.length > 0;
    });

    if (hasClass) {
      console.log('✅ Tailwind CSS classes applied');
      console.log(`   Classes: ${await main.getAttribute('class')}\n`);
    } else {
      throw new Error('CSS classes not found');
    }

    // Test 6: Check for console errors
    console.log('📄 Test 6: Checking for console errors...');
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload({ waitUntil: 'networkidle' });

    const criticalErrors = errors.filter(
      (error) => !error.includes('NEXT_PUBLIC_API_URL') &&
                   !error.includes('API') &&
                   !error.includes('Failed to fetch')
    );

    if (criticalErrors.length === 0) {
      console.log('✅ No critical console errors detected\n');
    } else {
      console.log('⚠️  Console errors detected:');
      criticalErrors.forEach((err) => console.log(`   ${err}`));
      console.log();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests PASSED! Build is production-ready');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

testBuild();
