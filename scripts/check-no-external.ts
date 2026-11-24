// Verifica se o dist/ tenta carregar ou enviar algo a domínio externo.
// Uso: npx tsx scripts/check-no-external.ts [pasta]   (padrão: dist)
// Sai com código 1 se achar referência externa ou se não houver nenhuma página HTML.
//
// Arquivos varridos: html, htm, svg, css, js, mjs, cjs, json, xml, txt, webmanifest.
// Binários (fontes, imagens) não têm texto de referência; são locais e entram pelo caminho
// que aparece no HTML/CSS, que já é verificado.
//
// Conta como requisição ou envio:
// - HTML: src, srcset, poster, data, ping, action, formaction, background, lowsrc, dynsrc,
//   codebase, archive; qualquer href exceto <a href> e <link rel=canonical|alternate>;
//   <meta http-equiv=refresh> com url externa; style="" e blocos <style>/<script> inline.
//   Aceita valor sem aspas, valor com ">" entre aspas, entidades (&#104; etc.) e escapes CSS (\68).
// - CSS: @import, url() e image-set() (com strings).
// - JS: strings literais com URL externa (não rastreia URL montada por concatenação).
// - Texto (json, xml, txt, webmanifest): URLs http(s)/ws(s)/ftp e "//host" entre aspas.
//
// Também não conta: o próprio domínio do site (DOMINIOS_PROPRIOS, ex.: canonical e sitemap) e o corpo de
// <script type="application/ld+json">, que é dado para buscadores e não é carregado pelo navegador.
//
// Exceção declarada: o mapa de /igrupos carrega tiles do OpenStreetMap (HOSTS_PERMITIDOS_NO_JS, só em
// strings de JS; HTML e CSS continuam sem nenhum domínio externo).
//
// Não conta: <a href> (navegação do usuário), comentários HTML, data: e namespaces XML
// (http://www.w3.org/... em xmlns ou em JS/texto), que são identificadores e não carregam nada;
// em JS, a string exata "https://react.dev/errors/" das mensagens de erro do React.

import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface Achado {
  origem: string; // onde apareceu, ex.: "<img> src", "css url()", "<script> inline"
  url: string;
}

const EXTENSOES_HTML = ['.html', '.htm', '.svg'];
const EXTENSOES_CSS = ['.css'];
const EXTENSOES_JS = ['.js', '.mjs', '.cjs'];
const EXTENSOES_TEXTO = ['.json', '.xml', '.txt', '.webmanifest'];
export const EXTENSOES_VERIFICADAS = [...EXTENSOES_HTML, ...EXTENSOES_CSS, ...EXTENSOES_JS, ...EXTENSOES_TEXTO];

// Atributos que carregam ou enviam (exceto href, tratado à parte). Casa "src" e "xlink:src", não "data-src".
const ATRIBUTOS_DE_RECURSO =
  /(^|:)(src|poster|data|ping|action|formaction|background|lowsrc|dynsrc|codebase|archive)$/i;

// Bloco <style>/<script> inteiro. O corpo é tratado como CSS/JS; a tag de abertura continua
// passando pelo varredor de atributos.
const BLOCO_BRUTO = /<(style|script)\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/\1\s*>/gi;

// Tag de abertura: nome, depois atributos (com valor entre aspas, sem aspas ou sem valor).
const TAG = /<([a-zA-Z][^\s/>]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATRIBUTO = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function ponto(n: number): string {
  return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
}

function decodificarEntidades(valor: string): string {
  return valor
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => ponto(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => ponto(parseInt(dec, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&sol;/gi, '/')
    .replace(/&amp;/gi, '&');
}

function decodificarEscapesCss(valor: string): string {
  return valor
    .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex: string) => ponto(parseInt(hex, 16)))
    .replace(/\\([^\n\r0-9a-fA-F])/g, '$1');
}

// Navegadores removem tab, quebra de linha e controles do começo da URL antes de usá-la.
function normalizarUrl(url: string): string {
  return url.replace(/[\t\n\r]/g, '').replace(/^[\u0000- ]+/, '').trim();
}

function ehExterna(url: string): boolean {
  const u = normalizarUrl(url);
  return (/^(https?|wss?|ftp):/i.test(u) || /^[\\/]{2}/.test(u)) && !ehDominioProprio(u);
}

// Namespace XML/SVG: identificador, não carrega nada. Só vale fora de atributos de recurso.
function ehNamespace(url: string): boolean {
  return /^https?:\/\/www\.(w3|sitemaps)\.org\//i.test(normalizarUrl(url));
}

export function encontrarNoCss(css: string, origem = 'css'): Achado[] {
  const achados: Achado[] = [];
  const adicionar = (url: string, rotulo: string): void => {
    if (ehExterna(url)) achados.push({ origem: `${origem} ${rotulo}`, url: normalizarUrl(url) });
  };

  let texto = decodificarEscapesCss(css.replace(/\/\*[\s\S]*?\*\//g, ''));

  // @import primeiro, e tirado do texto para o url() não contar o mesmo caso de novo.
  const importRe = /@import\s+(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]*))\s*\)|"([^"]*)"|'([^']*)')/gi;
  for (const m of texto.matchAll(importRe)) {
    adicionar(m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '', '@import');
  }
  texto = texto.replace(importRe, '');

  for (const m of texto.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]*))\s*\)/gi)) {
    adicionar(m[1] ?? m[2] ?? m[3] ?? '', 'url()');
  }

  for (const m of texto.matchAll(/(?:-webkit-)?image-set\(([^)]*)\)/gi)) {
    for (const s of (m[1] ?? '').matchAll(/"([^"]*)"|'([^']*)'/g)) {
      adicionar(s[1] ?? s[2] ?? '', 'image-set()');
    }
  }

  return achados;
}

// Texto de mensagem de erro do React em produção ("https://react.dev/errors/" + código): vai para o
// console, não é carregado. Só a string exata, só em JS; qualquer outro caminho do react.dev acusa.
function ehTextoDeErroDoReact(url: string): boolean {
  return normalizarUrl(url) === 'https://react.dev/errors/';
}

// Domínio do próprio site: URL absoluta para ele não é terceiro.
export const DOMINIOS_PROPRIOS = ['ivales.org', 'www.ivales.org'];

function ehDominioProprio(url: string): boolean {
  try {
    return DOMINIOS_PROPRIOS.includes(new URL(normalizarUrl(url)).hostname);
  } catch {
    return false;
  }
}

// Hosts que o JS pode citar. Só o tile server do mapa de /igrupos; ver o cabeçalho do arquivo.
// Também os links que só viram <a href> (navegação do usuário, nada é carregado): atribuição do mapa
// (Leaflet/OSM) e o link do WhatsApp dos líderes, montados dentro do JS da ilha.
export const HOSTS_PERMITIDOS_NO_JS = ['tile.openstreetmap.org', 'www.openstreetmap.org', 'leafletjs.com', 'wa.me'];

function ehHostPermitidoNoJs(url: string): boolean {
  try {
    const host = new URL(normalizarUrl(url)).hostname;
    return HOSTS_PERMITIDOS_NO_JS.includes(host);
  } catch {
    return false;
  }
}

export function encontrarNoJs(js: string, origem = 'js'): Achado[] {
  const achados: Achado[] = [];
  for (const m of js.matchAll(/(["'`])((?:https?:)?\/\/[^"'`\s]+)\1/gi)) {
    const url = m[2] ?? '';
    if (ehExterna(url) && !ehNamespace(url) && !ehTextoDeErroDoReact(url) && !ehHostPermitidoNoJs(url)) achados.push({ origem, url: normalizarUrl(url) });
  }
  return achados;
}

export function encontrarNoTexto(texto: string, origem = 'texto'): Achado[] {
  const achados: Achado[] = [];
  const candidatos = [
    ...texto.matchAll(/(?:https?|wss?|ftp):\/\/[^\s"'<>\\]+/gi),
    ...texto.matchAll(/"(\/\/[^"\s]+)"/g),
  ];
  for (const m of candidatos) {
    const url = m[1] ?? m[0];
    if (ehExterna(url) && !ehNamespace(url)) achados.push({ origem, url: normalizarUrl(url) });
  }
  return achados;
}

export function encontrarNoHtml(html: string): Achado[] {
  const achados: Achado[] = [];

  // Comentário não é carregado pelo navegador.
  const semComentarios = html.replace(/<!--[\s\S]*?-->/g, '');

  // Corpo de <style> e <script> vai para o verificador de CSS/JS; a tag fica para a varredura de atributos.
  const restante = semComentarios.replace(BLOCO_BRUTO, (_bloco, nome: string, atributos: string, corpo: string) => {
    if (nome.toLowerCase() === 'style') achados.push(...encontrarNoCss(corpo, '<style>'));
    else if (!/\btype\s*=\s*["']?application\/ld\+json/i.test(atributos)) achados.push(...encontrarNoJs(corpo, '<script> inline'));
    return `<${nome}${atributos}></${nome}>`;
  });

  for (const m of restante.matchAll(TAG)) {
    const tag = (m[1] ?? '').toLowerCase();
    const atributos = new Map<string, string>();
    for (const a of (m[2] ?? '').matchAll(ATRIBUTO)) {
      const nome = (a[1] ?? '').toLowerCase();
      if (!atributos.has(nome)) atributos.set(nome, decodificarEntidades(a[2] ?? a[3] ?? a[4] ?? ''));
    }

    const ehMetadado = /\b(canonical|alternate)\b/i.test(atributos.get('rel') ?? '');

    for (const [nome, valor] of atributos) {
      const rotulo = `<${tag}> ${nome}`;

      if (nome === 'style') {
        achados.push(...encontrarNoCss(valor, `<${tag} style="">`));
        continue;
      }

      if (nome === 'content' && tag === 'meta' && (atributos.get('http-equiv') ?? '').toLowerCase() === 'refresh') {
        const alvo = /url\s*=\s*['"]?([^'";\s]+)/i.exec(valor)?.[1] ?? '';
        if (ehExterna(alvo)) achados.push({ origem: 'meta refresh', url: normalizarUrl(alvo) });
        continue;
      }

      if (nome === 'srcset') {
        for (const candidato of valor.split(',')) {
          const url = candidato.trim().split(/\s+/)[0] ?? '';
          if (ehExterna(url)) achados.push({ origem: rotulo, url: normalizarUrl(url) });
        }
        continue;
      }

      if (nome === 'ping') {
        for (const url of valor.split(/\s+/)) {
          if (ehExterna(url)) achados.push({ origem: rotulo, url: normalizarUrl(url) });
        }
        continue;
      }

      if (ATRIBUTOS_DE_RECURSO.test(nome)) {
        if (ehExterna(valor)) achados.push({ origem: rotulo, url: normalizarUrl(valor) });
        continue;
      }

      // Qualquer href (use, base, link, image, xlink:href...), exceto <a href> e canonical/alternate.
      if (nome.endsWith('href') && !nome.startsWith('data-')) {
        const navegacao = tag === 'a' && nome === 'href';
        const metadado = tag === 'link' && ehMetadado;
        if (!navegacao && !metadado && ehExterna(valor)) {
          achados.push({ origem: rotulo, url: normalizarUrl(valor) });
        }
      }
    }
  }

  return achados;
}

export function encontrarReferencias(nomeArquivo: string, conteudo: string): Achado[] {
  const ext = extname(nomeArquivo).toLowerCase();
  if (EXTENSOES_HTML.includes(ext)) return encontrarNoHtml(conteudo);
  if (EXTENSOES_CSS.includes(ext)) return encontrarNoCss(conteudo);
  if (EXTENSOES_JS.includes(ext)) return encontrarNoJs(conteudo);
  if (EXTENSOES_TEXTO.includes(ext)) return encontrarNoTexto(conteudo);
  return [];
}

async function listarArquivos(pasta: string): Promise<string[]> {
  const entradas = await readdir(pasta, { withFileTypes: true });
  const caminhos: string[] = [];
  for (const entrada of entradas) {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) caminhos.push(...(await listarArquivos(caminho)));
    else caminhos.push(caminho);
  }
  return caminhos;
}

async function principal(pasta: string): Promise<number> {
  const arquivos = (await listarArquivos(pasta)).filter((a) => EXTENSOES_VERIFICADAS.includes(extname(a).toLowerCase()));
  const paginas = arquivos.filter((a) => ['.html', '.htm'].includes(extname(a).toLowerCase()));

  if (paginas.length === 0) {
    console.error(`Nenhuma página .html encontrada em ${pasta}. Rode "npm run build" antes.`);
    return 1;
  }

  const contagem = new Map<string, number>();
  const problemas: string[] = [];
  for (const arquivo of arquivos) {
    const ext = extname(arquivo).toLowerCase();
    contagem.set(ext, (contagem.get(ext) ?? 0) + 1);
    for (const a of encontrarReferencias(arquivo, await readFile(arquivo, 'utf8'))) {
      problemas.push(`${relative(pasta, arquivo)}: ${a.origem} → ${a.url}`);
    }
  }

  if (problemas.length > 0) {
    console.error(`Recursos externos encontrados (${problemas.length}):`);
    for (const linha of problemas) console.error(`  ${linha}`);
    return 1;
  }

  const resumo = [...contagem].map(([ext, n]) => `${n} ${ext}`).join(', ');
  console.log(`OK: ${arquivos.length} arquivo(s) de texto verificados (${resumo}) sem referência a domínio externo.`);
  return 0;
}

// Só executa quando chamado direto pelo terminal (não quando importado pelos testes).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal(process.argv[2] ?? 'dist').then((codigo) => process.exit(codigo));
}
