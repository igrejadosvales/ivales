import type { APIRoute } from 'astro';

const PUBLIC_ROUTES = ['/', '/sobre/', '/ministerios/', '/voluntariado/', '/ofertar/', '/contato/', '/membros/'] as const;

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL('https://igrejadosvales.com.br');
  const urls = PUBLIC_ROUTES.map((route) => `  <url><loc>${new URL(route, baseUrl).toString()}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
