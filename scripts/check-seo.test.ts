import { describe, expect, it } from 'vitest';
import { analisarPagina, problemasDaPagina, urlDaPagina, urlsDoSitemap } from './check-seo';

const pagina = (extra = '', titulo = 'Contato, endereços e horários | Igreja dos Vales') => `<!doctype html><html><head>
<title>${titulo}</title>
<meta name="description" content="Endereços e horários dos cultos da Igreja dos Vales em Gravataí e em Porto Alegre, no Sarandi.">
<link rel="canonical" href="https://ivales.org/contato">
<meta name="robots" content="index, follow">
<meta property="og:url" content="https://ivales.org/contato">
<meta property="og:image" content="https://ivales.org/_astro/hero.jpg">
<script type="application/ld+json">{"@type":"Church"}</script>
${extra}</head><body><main><h1>Contato</h1></main></body></html>`;

describe('urlDaPagina', () => {
  it('converte os dois formatos de build', () => {
    expect(urlDaPagina('index.html')).toBe('https://ivales.org/');
    expect(urlDaPagina('sobre.html')).toBe('https://ivales.org/sobre');
    expect(urlDaPagina('sobre/index.html')).toBe('https://ivales.org/sobre');
  });
});

describe('problemasDaPagina', () => {
  it('página completa e no sitemap passa', () => {
    expect(problemasDaPagina('https://ivales.org/contato', analisarPagina(pagina()), true)).toEqual([]);
  });

  it('acusa título curto, canonical errado, dois h1, JSON-LD quebrado e fora do sitemap', () => {
    const html = pagina('<script type="application/ld+json">{quebrado</script>', 'Contato')
      .replace('https://ivales.org/contato">', 'https://ivales.org/contato.html">')
      .replace('<h1>Contato</h1>', '<h1>A</h1><h1>B</h1>');
    const p = problemasDaPagina('https://ivales.org/contato', analisarPagina(html), false);
    expect(p.join('\n')).toMatch(/<title> com 7/);
    expect(p.join('\n')).toMatch(/canonical/);
    expect(p.join('\n')).toMatch(/2 <h1>/);
    expect(p.join('\n')).toMatch(/JSON-LD inválido/);
    expect(p.join('\n')).toMatch(/fora do sitemap/);
  });

  it('noindex só não pode estar no sitemap', () => {
    const info = analisarPagina(pagina().replace('index, follow', 'noindex, nofollow'));
    expect(problemasDaPagina('https://ivales.org/membros', info, false)).toEqual([]);
    expect(problemasDaPagina('https://ivales.org/membros', info, true)).toEqual(['tem noindex mas está no sitemap']);
  });
});

it('lê as URLs do sitemap', () => {
  expect(urlsDoSitemap('<url><loc>https://ivales.org/</loc></url><url><loc>https://ivales.org/sobre</loc></url>')).toEqual([
    'https://ivales.org/',
    'https://ivales.org/sobre',
  ]);
});
