import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
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

// PUBLIC_* variables are inlined into the browser bundle, so a Supabase secret key there
// would give any visitor full access to the database. Fail the build instead.
const isSecretKey = (value) => {
  if (value.startsWith('sb_secret_')) return true;
  const payload = value.split('.')[1];
  return Boolean(payload) && Buffer.from(payload, 'base64url').toString().includes('"service_role"');
};

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
for (const [name, value] of Object.entries(env)) {
  if (isSecretKey(value)) {
    throw new Error(`${name} holds a Supabase secret key. Use the publishable key (sb_publishable_...).`);
  }
}

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
