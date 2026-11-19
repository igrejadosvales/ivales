import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { rm } from 'node:fs/promises';

// Páginas que só existem em desenvolvimento (vitrine de componentes).
// Não entram no dist/ de produção.
const DEV_ONLY_PAGES = ['design'];

const devOnlyPages = {
  name: 'ivales-dev-only-pages',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      for (const page of DEV_ONLY_PAGES) {
        await rm(new URL(`${page}/`, dir), { recursive: true, force: true });
      }
    },
  },
};

export default defineConfig({
  site: 'https://igrejadosvales.com.br',
  output: 'static',
  // Rotas antigas do site atual (seção 5 do plano v2).
  // Em build estático sem adapter o Astro gera redirecionamento por meta refresh
  // (status 200). O status 301 real precisa de adapter ou de regra no host (fase 2).
  redirects: {
    '/voluntarios': { status: 301, destination: '/voluntariado' },
    '/contact': { status: 301, destination: '/contato' },
    '/biblia': { status: 301, destination: '/' },
  },
  // React só nas ilhas (HeroUI). Páginas estáticas não carregam JS de framework.
  integrations: [react(), devOnlyPages],
  vite: {
    plugins: [tailwindcss()],
  },
});
