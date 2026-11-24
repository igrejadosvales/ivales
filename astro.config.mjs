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
        await rm(new URL(`${page}.html`, dir), { force: true });
      }
    },
  },
};

export default defineConfig({
  site: 'https://ivales.org',
  output: 'static',
  // URLs sem barra no final (/sobre), iguais aos links internos e ao canonical.
  // O build gera sobre.html e a Vercel serve como /sobre (cleanUrls no vercel.json).
  trailingSlash: 'never',
  build: { format: 'file' },
  // Rotas antigas do site anterior. Na Vercel o 301 real vem do vercel.json; estas páginas de
  // meta refresh ficam só como plano B para outros hosts.
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
