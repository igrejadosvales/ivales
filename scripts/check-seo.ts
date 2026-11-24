// Confere o básico de SEO em cada página do dist/.
// Uso: npx tsx scripts/check-seo.ts [pasta]   (padrão: dist)
// Sai com código 1 se alguma regra falhar.
//
// Página indexável (sem noindex):
// - <title> entre TITULO_MIN e TITULO_MAX caracteres; meta description entre DESCRICAO_MIN e DESCRICAO_MAX.
// - Um único <h1>.
// - canonical e og:url absolutos no domínio oficial (SITE_URL), iguais entre si, sem barra final (exceto a home).
// - og:image absoluto.
// - Todo <script type="application/ld+json"> é JSON válido.
// - Está no sitemap.xml.
// Página com noindex: fora do sitemap.
// Sitemap: só URLs do domínio oficial que existem no dist/.
// Páginas de redirecionamento (meta refresh, sem <main>) são ignoradas.

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SITE_URL } from '../src/lib/igreja';

export const TITULO_MIN = 30;
export const TITULO_MAX = 65;
export const DESCRICAO_MIN = 70;
export const DESCRICAO_MAX = 160;

const decodificar = (t: string) =>
  t
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

function meta(html: string, atributo: 'name' | 'property', valor: string): string | undefined {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    if (new RegExp(`\\b${atributo}=["']${valor.replace(/[:]/g, '\\:')}["']`, 'i').test(tag)) {
      const conteudo = /\bcontent=["']([^"']*)["']/i.exec(tag)?.[1];
      return conteudo === undefined ? undefined : decodificar(conteudo);
    }
  }
  return undefined;
}

export interface InfoPagina {
  titulo?: string;
  descricao?: string;
  h1: number;
  canonical?: string;
  ogUrl?: string;
  ogImage?: string;
  noindex: boolean;
  jsonLdInvalido: number;
  redirecionamento: boolean;
}

export function analisarPagina(html: string): InfoPagina {
  const titulo = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const canonical = /<link\b[^>]*rel=["']canonical["'][^>]*>/i.exec(html)?.[0];
  let jsonLdInvalido = 0;
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(m[1] ?? '');
    } catch {
      jsonLdInvalido++;
    }
  }
  return {
    titulo: titulo === undefined ? undefined : decodificar(titulo.trim()),
    descricao: meta(html, 'name', 'description'),
    h1: (html.match(/<h1\b/gi) ?? []).length,
    canonical: canonical ? /\bhref=["']([^"']*)["']/i.exec(canonical)?.[1] : undefined,
    ogUrl: meta(html, 'property', 'og:url'),
    ogImage: meta(html, 'property', 'og:image'),
    noindex: /noindex/i.test(meta(html, 'name', 'robots') ?? ''),
    jsonLdInvalido,
    redirecionamento: /<meta http-equiv="refresh"/i.test(html) && !/<main\b/i.test(html),
  };
}

/** Caminho do arquivo no dist/ → URL pública (index.html → /, sobre.html → /sobre, a/index.html → /a). */
export function urlDaPagina(caminho: string): string {
  const rota = caminho.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
  return rota ? `${SITE_URL}/${rota}` : `${SITE_URL}/`;
}

export function problemasDaPagina(url: string, info: InfoPagina, noSitemap: boolean): string[] {
  const p: string[] = [];
  if (info.noindex) {
    if (noSitemap) p.push('tem noindex mas está no sitemap');
    return p;
  }
  const t = info.titulo ?? '';
  if (t.length < TITULO_MIN || t.length > TITULO_MAX) p.push(`<title> com ${t.length} caracteres (${TITULO_MIN}-${TITULO_MAX}): "${t}"`);
  const d = info.descricao ?? '';
  if (d.length < DESCRICAO_MIN || d.length > DESCRICAO_MAX)
    p.push(`description com ${d.length} caracteres (${DESCRICAO_MIN}-${DESCRICAO_MAX})`);
  if (info.h1 !== 1) p.push(`${info.h1} <h1> (esperado 1)`);
  if (info.canonical !== url) p.push(`canonical "${info.canonical ?? ''}" (esperado "${url}")`);
  if (info.ogUrl !== info.canonical) p.push('og:url diferente do canonical');
  if (!info.ogImage?.startsWith(`${SITE_URL}/`)) p.push(`og:image "${info.ogImage ?? ''}" fora do domínio oficial`);
  if (info.jsonLdInvalido > 0) p.push(`${info.jsonLdInvalido} bloco(s) JSON-LD inválido(s)`);
  if (!noSitemap) p.push('indexável mas fora do sitemap');
  return p;
}

export function urlsDoSitemap(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? '');
}

async function listarHtml(pasta: string): Promise<string[]> {
  const saida: string[] = [];
  for (const e of await readdir(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, e.name);
    if (e.isDirectory()) saida.push(...(await listarHtml(caminho)));
    else if (e.name.endsWith('.html')) saida.push(caminho);
  }
  return saida;
}

async function principal(pasta: string): Promise<number> {
  const paginas = await listarHtml(pasta);
  if (paginas.length === 0) {
    console.error(`Nenhuma página .html em ${pasta}. Rode "npm run build" antes.`);
    return 1;
  }
  const sitemap = new Set(urlsDoSitemap(await readFile(join(pasta, 'sitemap.xml'), 'utf8')));
  const falhas: string[] = [];
  const existentes = new Set<string>();

  for (const arquivo of paginas.sort()) {
    const info = analisarPagina(await readFile(arquivo, 'utf8'));
    if (info.redirecionamento) continue;
    const url = urlDaPagina(relative(pasta, arquivo));
    existentes.add(url);
    const problemas = problemasDaPagina(url, info, sitemap.has(url));
    for (const pr of problemas) falhas.push(`${url}: ${pr}`);
    console.log(`${url}: ${info.noindex ? 'noindex' : problemas.length === 0 ? 'ok' : `${problemas.length} problema(s)`}`);
  }
  for (const url of sitemap) {
    if (!url.startsWith(`${SITE_URL}/`)) falhas.push(`sitemap: ${url} fora do domínio oficial`);
    else if (!existentes.has(url)) falhas.push(`sitemap: ${url} não existe no build`);
  }

  if (falhas.length > 0) {
    console.error(`Falhas de SEO (${falhas.length}):`);
    for (const f of falhas) console.error(`  ${f}`);
    return 1;
  }
  console.log(`OK: ${existentes.size} página(s) e ${sitemap.size} URL(s) no sitemap.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal(process.argv[2] ?? 'dist').then((codigo) => process.exit(codigo));
}
