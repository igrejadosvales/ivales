import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Lê os tokens de src/styles/global.css (o arquivo real) e confere o contraste WCAG 2.1 dos pares que os
// componentes usam, em cada tom: base clara, tom escuro e faixa azul. Também impede o retorno das cores laranja antigas.
const raiz = process.cwd();
const css = readFileSync(join(raiz, 'src/styles/global.css'), 'utf8');
const TEMA = /@theme\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
const ESCURO = /\[data-tom="escuro"\]\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';

function valor(bloco: string, nome: string): string {
  const achado = new RegExp(`--color-${nome}:\\s*(#[0-9a-fA-F]{6})`).exec(bloco);
  if (!achado) throw new Error(`Token --color-${nome} não encontrado`);
  return achado[1] ?? '';
}

// Base clara: o token do @theme. Tom escuro: o override, ou o da base se o tom não redefine.
const cor = (nome: string) => valor(TEMA, nome);
const corEscura = (nome: string) => {
  try {
    return valor(ESCURO, nome);
  } catch {
    return cor(nome);
  }
};

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return ((claro ?? 0) + 0.05) / ((escuro ?? 0) + 0.05);
}

describe('base clara: texto sobre fundo, mínimo 4.5:1 (WCAG AA)', () => {
  const pares: Array<[texto: string, fundo: string, onde: string]> = [
    ['ink', 'canvas', 'corpo, títulos, cabeçalho'],
    ['ink', 'surface', 'seção elevada e cartão'],
    ['ink-muted', 'canvas', 'texto de apoio (cinza-oliva da marca)'],
    ['ink-muted', 'surface', 'texto de apoio em seção elevada'],
    ['accent-text', 'canvas', 'eyebrow, link e ícone do accordion (azul)'],
    ['accent-text', 'surface', 'eyebrow em seção elevada (azul)'],
    ['on-accent', 'accent', 'texto branco do botão primário (azul)'],
    ['on-accent', 'accent-hover', 'texto branco do botão primário em hover'],
  ];
  for (const [texto, fundo, onde] of pares) {
    it(`${texto} sobre ${fundo} (${onde}) tem pelo menos 4.5:1`, () => {
      expect(contraste(cor(texto), cor(fundo))).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('tom escuro: texto sobre fundo escuro, mínimo 4.5:1', () => {
  const pares: Array<[texto: string, fundo: string, onde: string]> = [
    ['ink', 'canvas', 'títulos e texto da seção escura'],
    ['ink', 'surface', 'texto em superfície escura'],
    ['ink-muted', 'canvas', 'texto de apoio da seção escura'],
    ['ink-muted', 'surface', 'texto de apoio em superfície escura'],
    ['accent-text', 'canvas', 'eyebrow e detalhe azul no preto (azul claro do tom)'],
    ['accent-text', 'surface', 'detalhe azul em superfície escura'],
    ['on-accent', 'accent', 'texto branco do botão primário no escuro'],
  ];
  for (const [texto, fundo, onde] of pares) {
    it(`${texto} sobre ${fundo} no tom escuro (${onde}) tem pelo menos 4.5:1`, () => {
      expect(contraste(corEscura(texto), corEscura(fundo))).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('faixa azul (data-tom="destaque") e botões nela', () => {
  it('texto branco (on-accent) sobre o azul da faixa tem pelo menos 4.5:1', () => {
    expect(contraste(cor('on-accent'), cor('accent'))).toBeGreaterThanOrEqual(4.5);
  });

  it('borda branca do botão primário sobre o azul tem pelo menos 3:1 (forma visível)', () => {
    expect(contraste(cor('on-accent'), cor('accent'))).toBeGreaterThanOrEqual(3);
  });

  it('secundário na faixa: texto azul sobre o fundo branco, e em hover sobre surface, tem pelo menos 4.5:1', () => {
    expect(contraste(cor('accent'), cor('on-accent'))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(cor('accent'), cor('surface'))).toBeGreaterThanOrEqual(4.5);
  });

  it('secundário na faixa: o fundo branco se destaca do azul com pelo menos 3:1 (forma visível)', () => {
    expect(contraste(cor('on-accent'), cor('accent'))).toBeGreaterThanOrEqual(3);
  });

  it('primário no tom escuro: o azul sobre o preto tem pelo menos 3:1 (forma visível)', () => {
    expect(contraste(cor('accent'), corEscura('canvas'))).toBeGreaterThanOrEqual(3);
  });
});

describe('anel de foco: mínimo 3:1 contra o fundo (WCAG 1.4.11)', () => {
  it('tom claro: ink sobre canvas e surface', () => {
    for (const fundo of ['canvas', 'surface']) {
      expect(contraste(cor('focus'), cor(fundo))).toBeGreaterThanOrEqual(3);
    }
  });

  it('faixa azul: branco (on-accent) sobre o azul', () => {
    expect(contraste(cor('on-accent'), cor('accent'))).toBeGreaterThanOrEqual(3);
  });

  it('tom escuro: branco sobre canvas e surface escuros', () => {
    for (const fundo of ['canvas', 'surface']) {
      expect(contraste(corEscura('focus'), corEscura(fundo))).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('bordas que delimitam controle: mínimo 3:1 (WCAG 1.4.11)', () => {
  it('contorno em hover (border-strong) sobre canvas e surface, claros e escuros', () => {
    for (const fundo of ['canvas', 'surface']) {
      expect(contraste(cor('border-strong'), cor(fundo))).toBeGreaterThanOrEqual(3);
      expect(contraste(corEscura('border-strong'), corEscura(fundo))).toBeGreaterThanOrEqual(3);
    }
  });
});

// Guarda: as cores laranja antigas não podem voltar em nenhum arquivo de texto do projeto.
// O logo (PNG) fica de fora por ser binário; o SVG do placeholder entra na varredura.
describe('guarda: nenhuma cor laranja antiga no projeto', () => {
  const ANTIGAS = /cc5f23|db7438|a8481a|dc5f37|a83c1b|ff7a1a|fce300/i;
  const EXTENSOES = /\.(astro|ts|mjs|css|md|json|svg|html)$/i;

  function arquivos(pasta: string): string[] {
    return readdirSync(pasta).flatMap((nome) => {
      const caminho = join(pasta, nome);
      if (statSync(caminho).isDirectory()) return arquivos(caminho);
      return EXTENSOES.test(nome) ? [caminho] : [];
    });
  }

  it('src, design, e2e, scripts, public e README não citam o laranja antigo', () => {
    const alvos = ['src', 'design', 'e2e', 'scripts', 'public'].map((p) => join(raiz, p));
    const arqs = [...alvos.flatMap(arquivos), join(raiz, 'README.md')].filter(
      (a) => relative(raiz, a) !== 'src/styles/tokens.test.ts',
    );
    const achados = arqs.filter((a) => ANTIGAS.test(readFileSync(a, 'utf8'))).map((a) => relative(raiz, a));
    expect(achados).toEqual([]);
  });
});

// design/tokens.md é gerado do CSS: cada linha de hex precisa bater com o valor de global.css.
describe('design/tokens.md bate com o global.css', () => {
  const md = readFileSync(join(raiz, 'design/tokens.md'), 'utf8');
  const partes = md.split('## ');
  const secaoClara = partes.find((p) => p.startsWith('Base clara')) ?? '';
  const secaoEscura = partes.find((p) => p.startsWith('Tom escuro')) ?? '';
  const linhas = (secao: string) => [...secao.matchAll(/\| `([a-z-]+)` \| (#[0-9a-fA-F]{6})/g)].map((m) => [m[1] ?? '', (m[2] ?? '').toLowerCase()]);

  it('todos os tokens da base clara têm o mesmo hex no CSS', () => {
    const tabela = linhas(secaoClara);
    expect(tabela.length).toBeGreaterThan(0);
    for (const [nome, hex] of tabela) expect(cor(nome).toLowerCase(), nome).toBe(hex);
  });

  it('todos os tokens do tom escuro têm o mesmo hex no CSS', () => {
    const tabela = linhas(secaoEscura);
    expect(tabela.length).toBeGreaterThan(0);
    for (const [nome, hex] of tabela) expect(valor(ESCURO, nome).toLowerCase(), nome).toBe(hex);
  });
});
