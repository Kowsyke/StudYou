import { defineConfig } from '@playwright/test'

// Launch timeouts are generous because dev machines under load can take
// minutes to cold start a browser. CI class hardware starts in seconds.
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  retries: 1,
  expect: { timeout: 20_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    launchOptions: {
      timeout: 600_000,
      // Chrome throttles timers and rAF in occluded windows, which on a
      // loaded machine can freeze React updates mid test while the DOM
      // polling keeps seeing stale content. These are the standard CI
      // flags that disable background throttling entirely.
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
  },
  webServer: [
    {
      command: 'pnpm --filter @studyou/server start',
      url: 'http://localhost:3005/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @studyou/client dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
