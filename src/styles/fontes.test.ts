import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Fonte: DM Sans, uma família só (títulos e texto). Autohospedada via @fontsource-variable/dm-sans.
// O teste trava a volta das fontes antigas e confere se o subset latino cobre o português.
const raiz = process.cwd();
const css = readFileSync(join(raiz, 'src/styles/global.css'), 'utf8');
const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const todas: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
const cssDM = readFileSync(join(raiz, 'node_modules/@fontsource-variable/dm-sans/index.css'), 'utf8');

// Intervalos de unicode-range do pacote (ex.: "U+0000-00FF,U+0131").
const intervalos: Array<[number, number]> = [...cssDM.matchAll(/unicode-range:\s*([^;]+);/g)].flatMap((m) =>
  (m[1] ?? '').split(',').map((parte) => {
    const [a, b] = parte.trim().replace(/^U\+/, '').split('-');
    const inicio = parseInt(a ?? '0', 16);
    return [inicio, b ? parseInt(b, 16) : inicio] as [number, number];
  }),
);
const cobre = (codigo: number) => intervalos.some(([a, b]) => codigo >= a && codigo <= b);

describe('fonte: DM Sans, uma família só', () => {
  it('global.css importa apenas a DM Sans', () => {
    const importadas = [...css.matchAll(/@import\s+"@fontsource-variable\/([^"]+)";/g)].map((m) => m[1]);
    expect(importadas).toEqual(['dm-sans']);
  });

  it('as dependências antigas (Inter, Fraunces, Manrope) saíram do package.json', () => {
    for (const antiga of ['inter', 'fraunces', 'manrope']) {
      expect(todas).not.toHaveProperty(`@fontsource-variable/${antiga}`);
    }
    expect(todas).toHaveProperty('@fontsource-variable/dm-sans');
  });

  it('--font-sans aponta para a DM Sans e não existe família serifada', () => {
    expect(css).toMatch(/--font-sans:\s*"DM Sans Variable"/);
    expect(css).not.toMatch(/--font-serif/);
  });

  it('o subset latino cobre os acentos e o cedilha do pt-BR', () => {
    for (const caractere of 'çãõáéêíóúàâôÇÃÕÁÉÊÍÓÚÀ') {
      expect(cobre(caractere.codePointAt(0) ?? 0), caractere).toBe(true);
    }
  });
});
