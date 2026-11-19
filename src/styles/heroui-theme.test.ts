import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// O tema da HeroUI (src/styles/heroui-theme.css) só pode apontar para tokens do global.css.
// Assim os testes de contraste do tokens.test.ts continuam valendo para os componentes da HeroUI.
const raiz = process.cwd();
const global = readFileSync(join(raiz, 'src/styles/global.css'), 'utf8');
const tema = readFileSync(join(raiz, 'src/styles/heroui-theme.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const todas: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };

const blocoTema = /@theme\s*\{([\s\S]*?)\}/.exec(global)?.[1] ?? '';
const tokens = new Set([...blocoTema.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]));

// Declarações do bloco principal (:root, [data-tom]) e da faixa azul.
const blocos = [...tema.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  seletor: (m[1] ?? '').trim().replace(/\s+/g, ' '),
  decl: [...(m[2] ?? '').matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((d) => [d[1] ?? '', (d[2] ?? '').trim()] as const),
}));
const principal = blocos.find((b) => b.seletor === ':root, [data-tom]');
const destaque = blocos.find((b) => b.seletor === '[data-tom="destaque"]');

describe('heroui-theme.css aponta para os nossos tokens', () => {
  it('tem o bloco principal (:root e [data-tom]) e o da faixa azul', () => {
    expect(principal).toBeDefined();
    expect(destaque).toBeDefined();
  });

  it('nenhuma cor literal: toda variável usa var() de um token do @theme', () => {
    for (const bloco of blocos) {
      for (const [nome, valor] of bloco.decl) {
        expect(valor, `${bloco.seletor} ${nome}`).not.toMatch(/#[0-9a-f]{3,8}\b|oklch\(|rgb\(|hsl\(/i);
        if (/^\d/.test(valor)) continue; // larguras (ex.: --field-border-width: 1px)
        const usados = [...valor.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
        expect(usados.length, `${nome} precisa usar var()`).toBeGreaterThan(0);
        for (const usado of usados) expect(tokens.has(usado), `${nome} → ${usado} não existe no @theme`).toBe(true);
      }
    }
  });

  it('primário = azul com texto branco: --accent e --accent-foreground', () => {
    const mapa = new Map(principal?.decl);
    expect(mapa.get('--accent')).toBe('var(--color-accent)');
    expect(mapa.get('--accent-hover')).toBe('var(--color-accent-hover)');
    expect(mapa.get('--accent-foreground')).toBe('var(--color-on-accent)');
  });

  it('cobre as variáveis que a HeroUI usa para fundo, texto, borda, foco e campos', () => {
    const nomes = new Set(principal?.decl.map(([n]) => n));
    for (const nome of [
      '--background', '--foreground', '--surface', '--surface-foreground', '--overlay', '--overlay-foreground',
      '--muted', '--default', '--default-foreground', '--accent', '--accent-foreground', '--border', '--separator',
      '--focus', '--link', '--field-background', '--field-foreground', '--field-placeholder', '--field-border',
      '--field-border-width', '--radius',
    ]) {
      expect(nomes.has(nome), nome).toBe(true);
    }
  });

  it('campos têm borda de 1px (a HeroUI vem com 0px) na cor border-strong, que passa 3:1', () => {
    const mapa = new Map(principal?.decl);
    expect(mapa.get('--field-border-width')).toBe('1px');
    expect(mapa.get('--field-border')).toBe('var(--color-border-strong)');
  });

  it('faixa azul: fundo azul, texto e foco brancos', () => {
    const mapa = new Map(destaque?.decl);
    expect(mapa.get('--background')).toBe('var(--color-accent)');
    expect(mapa.get('--foreground')).toBe('var(--color-on-accent)');
    expect(mapa.get('--focus')).toBe('var(--color-on-accent)');
  });
});

describe('global.css: import seletivo da HeroUI', () => {
  const imports = [...global.matchAll(/@import\s+"([^"]+)"/g)].map((m) => m[1] ?? '');

  it('não importa o CSS completo da HeroUI', () => {
    expect(imports).not.toContain('@heroui/styles');
    expect(imports).not.toContain('@heroui/styles/css');
    expect(imports.some((i) => i.includes('heroui.min.css') || i === '@heroui/react/styles.css')).toBe(false);
  });

  it('utilities sem layer() (o Tailwind recusa @utility aninhado)', () => {
    expect(global).toMatch(/@import "@heroui\/styles\/utilities";/);
  });

  it('o nosso @theme vem depois do tema da HeroUI (os tokens vencem nos nomes repetidos)', () => {
    expect(global.indexOf('@theme {')).toBeGreaterThan(global.indexOf('@heroui/styles/themes/shared/theme.css'));
    expect(global.indexOf('@import "./heroui-theme.css"')).toBeGreaterThan(-1);
  });
});

describe('dependências', () => {
  it('@heroui/react e @heroui/styles fixos em 3.2.7 (sem ^ ou ~)', () => {
    expect(todas['@heroui/react']).toBe('3.2.7');
    expect(todas['@heroui/styles']).toBe('3.2.7');
  });

  it('ilhas em React (@astrojs/react); Preact fora', () => {
    expect(todas).toHaveProperty('@astrojs/react');
    expect(Object.keys(todas).some((n) => n.includes('preact'))).toBe(false);
  });
});
