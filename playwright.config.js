// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  webServer: {
    command: 'node server.js > .e2e-server.log 2>&1',
    url: 'http://127.0.0.1:8091',
    reuseExistingServer: false,
    timeout: 15000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 2000 },
    env: {
      PORT: '8091',
      SCORES_FILE: './test-results/scores-e2e.json',
      RESET_SCORES_ON_START: '1',
      TEST_IDLE_EXIT_MS: '30000',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:8091',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
