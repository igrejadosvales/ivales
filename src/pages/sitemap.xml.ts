import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/igreja';

// Só páginas públicas e indexáveis. /membros (área logada) e /design (só dev) ficam de fora.
export const ROTAS_DO_SITEMAP = ['/', '/sobre', '/ministerios', '/igrupos', '/voluntariado', '/ofertar', '/contato'] as const;

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL(SITE_URL);
  const hoje = new Date().toISOString().slice(0, 10);
  const urls = ROTAS_DO_SITEMAP.map(
    (rota) => `  <url><loc>${new URL(rota, baseUrl).toString()}</loc><lastmod>${hoje}</lastmod></url>`,
  ).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
