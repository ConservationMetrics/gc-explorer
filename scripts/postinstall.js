#!/usr/bin/env node

import { execSync } from 'child_process';

// Run nuxt prepare
try {
  execSync('nuxt prepare', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running nuxt prepare:', error);
  process.exit(1);
}

// Only install Playwright browsers if:
// 1. PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is not set to '1'
// 2. CI is not 'true'
// 3. NODE_ENV is not 'production'
// 4. @playwright/test is available (dev dependency)
const skipPlaywright =
  process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1' ||
  process.env.CI === 'true' ||
  process.env.NODE_ENV === 'production';

if (!skipPlaywright) {
  try {
    // Check if @playwright/test is available
    require.resolve('@playwright/test');
    // Install Playwright browsers
    execSync('pnpm exec playwright install --with-deps', { stdio: 'inherit' });
  } catch (error) {
    // @playwright/test not available or installation failed, silently skip
    // This is expected in production builds where devDependencies aren't installed
  }
}

