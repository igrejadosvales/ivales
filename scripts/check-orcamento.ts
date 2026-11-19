// Orçamento de peso e "página estática sem JS" do dist/.
// Uso: npx tsx scripts/check-orcamento.ts [pasta]   (padrão: dist)
// Sai com código 1 se alguma regra falhar.
//
// Regras, por página .html:
// - CSS (folhas linkadas + <style> inline): no máximo ORCAMENTO_CSS_GZIP bytes em gzip.
// - Página estática (fora de PAGINAS_COM_ILHA): nenhum <astro-island>, nenhum <script src> e nenhum
//   <script> inline, exceto JSON-LD e os scripts de melhoria progressiva da lista SCRIPTS_PERMITIDOS
//   (marcados com data-script="..."). O menu mobile funciona sem JS; o script dele só acrescenta Escape.
//   O do cabeçalho só troca o fundo ao rolar.
// - Página com ilha: soma o JS das ilhas (component-url, renderer-url e os imports estáticos deles) e
//   avisa o total; falha acima de ORCAMENTO_JS_ILHA_GZIP.

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const ORCAMENTO_CSS_GZIP = 20 * 1024;
export const ORCAMENTO_JS_ILHA_GZIP = 140 * 1024;
export const SCRIPTS_PERMITIDOS = ['menu-mobile', 'header-scroll'];
// Rotas (relativas ao dist/, sem barra final) que podem ter ilha.
export const PAGINAS_COM_ILHA = ['design', 'contato', 'voluntariado', 'membros'];

const SCRIPT = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi;

function atributo(atributos: string, nome: string): string | undefined {
  const m = new RegExp(`\\b${nome}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(atributos);
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : undefined;
}

export interface ProblemaScript {
  motivo: string;
}

// Lista o que uma página estática não pode ter.
export function scriptsProibidos(html: string): ProblemaScript[] {
  const semComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
  const problemas: ProblemaScript[] = [];
  if (/<astro-island\b/i.test(semComentarios)) problemas.push({ motivo: '<astro-island> (ilha) em página estática' });
  for (const m of semComentarios.matchAll(SCRIPT)) {
    const atributos = m[1] ?? '';
    const src = atributo(atributos, 'src');
    const tipo = (atributo(atributos, 'type') ?? '').toLowerCase();
    const marcador = atributo(atributos, 'data-script');
    if (src !== undefined) problemas.push({ motivo: `<script src="${src}">` });
    else if (tipo === 'application/ld+json') continue;
    else if (marcador && SCRIPTS_PERMITIDOS.includes(marcador)) continue;
    else problemas.push({ motivo: `<script> inline não permitido (${(m[2] ?? '').trim().slice(0, 60)}...)` });
  }
  return problemas;
}

export function folhasDeEstilo(html: string): string[] {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /\brel\s*=\s*["']?stylesheet/i.test(tag))
    .map((tag) => atributo(tag, 'href') ?? '')
    .filter(Boolean);
}

export function estilosInline(html: string): string {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map((m) => m[1] ?? '').join('\n');
}

export function urlsDeIlha(html: string): string[] {
  const urls = new Set<string>();
  for (const m of html.matchAll(/<astro-island\b[^>]*>/gi)) {
    for (const nome of ['component-url', 'renderer-url']) {
      const u = atributo(m[0], nome);
      if (u) urls.add(u);
    }
  }
  return [...urls];
}

// Imports estáticos relativos de um módulo JS minificado (import"./a.js", from"./b.js").
export function importsEstaticos(js: string): string[] {
  return [...js.matchAll(/(?:\bfrom|\bimport)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)].map((m) => m[1] ?? '');
}

export const gzip = (texto: string | Buffer): number => gzipSync(texto, { level: 9 }).length;

async function listarHtml(pasta: string): Promise<string[]> {
  const entradas = await readdir(pasta, { withFileTypes: true });
  const saida: string[] = [];
  for (const e of entradas) {
    const caminho = join(pasta, e.name);
    if (e.isDirectory()) saida.push(...(await listarHtml(caminho)));
    else if (e.name.endsWith('.html')) saida.push(caminho);
  }
  return saida;
}

async function jsDaIlha(pasta: string, urls: string[]): Promise<{ arquivos: string[]; gzip: number }> {
  const vistos = new Set<string>();
  const fila = urls.map((u) => join(pasta, u));
  let total = 0;
  while (fila.length > 0) {
    const arquivo = resolve(fila.shift() ?? '');
    if (vistos.has(arquivo)) continue;
    vistos.add(arquivo);
    const js = await readFile(arquivo);
    total += gzip(js);
    for (const imp of importsEstaticos(js.toString('utf8'))) fila.push(join(dirname(arquivo), imp));
  }
  return { arquivos: [...vistos].map((a) => relative(pasta, a)), gzip: total };
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

async function principal(pasta: string): Promise<number> {
  const paginas = await listarHtml(pasta);
  if (paginas.length === 0) {
    console.error(`Nenhuma página .html em ${pasta}. Rode "npm run build" antes.`);
    return 1;
  }
  const falhas: string[] = [];
  for (const pagina of paginas.sort()) {
    const html = await readFile(pagina, 'utf8');
    const rota = relative(pasta, dirname(pagina)) || '/';
    // Redirecionamento estático (meta refresh) não tem layout nem CSS.
    if (/<meta http-equiv="refresh"/i.test(html) && !/<main\b/i.test(html)) continue;

    let css = estilosInline(html);
    for (const href of folhasDeEstilo(html)) css += await readFile(join(pasta, href), 'utf8');
    const cssGzip = gzip(css);
    if (cssGzip > ORCAMENTO_CSS_GZIP) falhas.push(`${rota}: CSS ${kb(cssGzip)} gzip > ${kb(ORCAMENTO_CSS_GZIP)}`);

    if (PAGINAS_COM_ILHA.includes(rota)) {
      const ilha = await jsDaIlha(pasta, urlsDeIlha(html));
      console.log(`${rota}: CSS ${kb(cssGzip)} gzip; JS das ilhas ${kb(ilha.gzip)} gzip (${ilha.arquivos.length} arquivos)`);
      if (ilha.gzip > ORCAMENTO_JS_ILHA_GZIP) falhas.push(`${rota}: JS ${kb(ilha.gzip)} gzip > ${kb(ORCAMENTO_JS_ILHA_GZIP)}`);
    } else {
      const problemas = scriptsProibidos(html);
      for (const p of problemas) falhas.push(`${rota}: ${p.motivo}`);
      console.log(`${rota}: CSS ${kb(cssGzip)} gzip; estática, ${problemas.length === 0 ? '0 JS além do menu' : 'COM JS'}`);
    }
  }
  if (falhas.length > 0) {
    console.error(`Falhas de orçamento (${falhas.length}):`);
    for (const f of falhas) console.error(`  ${f}`);
    return 1;
  }
  console.log(`OK: ${paginas.length} página(s) dentro do orçamento.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal(process.argv[2] ?? 'dist').then((codigo) => process.exit(codigo));
}
