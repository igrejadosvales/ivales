/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig reaproveita a configuração do Astro (aliases, plugins, CSS) nos testes.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
