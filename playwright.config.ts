import { defineConfig, devices } from '@playwright/test';

// Os testes de e2e rodam contra `astro dev`, porque a vitrine /design só existe em dev.
// O Astro 7 sobe o dev server como daemon: e2e/global-setup.ts sobe e devolve a função que para.
// Porta própria (4399) para não tocar no dev server do usuário (4321).
const PORTA_E2E = 4399;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${PORTA_E2E}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
