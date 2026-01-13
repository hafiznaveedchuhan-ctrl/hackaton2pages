import { test, expect } from '@playwright/test';

const GITHUB_PAGES_URL = 'https://hafiznaveedchuhan-ctrl.github.io/hackaton2pages/';

test.describe('GitHub Pages Frontend Deployment', () => {
  test('should load homepage without 404 errors', async ({ page }) => {
    const response = await page.goto(GITHUB_PAGES_URL, { waitUntil: 'networkidle' });

    // Check response status
    expect(response?.status()).toBe(200);
    expect(page.url()).toContain('hackaton2pages');
  });

  test('should display main heading', async ({ page }) => {
    await page.goto(GITHUB_PAGES_URL);

    const heading = await page.locator('h1').first();
    await expect(heading).toContainText('AI-Powered Task Management');
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto(GITHUB_PAGES_URL);

    // Check for Get Started button
    const getStartedBtn = await page.locator('a:has-text("Get Started")').first();
    await expect(getStartedBtn).toBeVisible();

    // Check for Sign In button
    const signInBtn = await page.locator('a:has-text("Sign In")');
    await expect(signInBtn).toBeVisible();

    // Check for Try AI Chat button
    const chatBtn = await page.locator('a:has-text("Try AI Chat")');
    await expect(chatBtn).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto(GITHUB_PAGES_URL);

    const signupLink = await page.locator('a[href*="signup"]').first();
    await signupLink.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Check if we're on signup page
    expect(page.url()).toContain('/hackaton2pages/signup');
  });

  test('should navigate to signin page', async ({ page }) => {
    await page.goto(GITHUB_PAGES_URL);

    const signinLink = await page.locator('a[href*="signin"]').first();
    await signinLink.click();

    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/hackaton2pages/signin');
  });

  test('should navigate to chat page', async ({ page }) => {
    await page.goto(GITHUB_PAGES_URL);

    const chatLink = await page.locator('a[href*="chat"]').first();
    await chatLink.click();

    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/hackaton2pages/chat');
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.goto(GITHUB_PAGES_URL);

    const tasksLink = await page.locator('a[href*="tasks"]').first();
    await tasksLink.click();

    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/hackaton2pages/tasks');
  });

  test('should have feature cards visible', async ({ page }) => {
    await page.goto(GITHUB_PAGES_URL);

    // Check for AI Chatbot card
    const aiCard = await page.locator('text=AI Chatbot').first();
    await expect(aiCard).toBeVisible();

    // Check for MCP Tools card
    const toolsCard = await page.locator('text=MCP Tools');
    await expect(toolsCard).toBeVisible();

    // Check for Secure Auth card
    const authCard = await page.locator('text=Secure Auth');
    await expect(authCard).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(GITHUB_PAGES_URL, { waitUntil: 'networkidle' });

    // Filter out network-related errors (expected for missing backend)
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('NEXT_PUBLIC_API_URL') &&
                   !error.includes('Failed to fetch') &&
                   !error.includes('API')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should load styles correctly (no FOUC)', async ({ page }) => {
    await page.goto(GITHUB_PAGES_URL, { waitUntil: 'networkidle' });

    const main = await page.locator('main').first();
    const bgColor = await main.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Check that styles are applied
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});
