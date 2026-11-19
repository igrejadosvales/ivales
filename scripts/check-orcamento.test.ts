import { describe, expect, it } from 'vitest';
import { folhasDeEstilo, importsEstaticos, scriptsProibidos, urlsDeIlha } from './check-orcamento';

const motivos = (html: string) => scriptsProibidos(html).map((p) => p.motivo);

describe('página estática: acusa JS', () => {
  it('<astro-island> acusa', () => {
    expect(motivos('<astro-island uid="1" component-url="/_astro/F.js"></astro-island>')).toEqual([
      '<astro-island> (ilha) em página estática',
    ]);
  });

  it('<script src> acusa, mesmo local', () => {
    expect(motivos('<script type="module" src="/_astro/page.js"></script>')).toEqual(['<script src="/_astro/page.js">']);
  });

  it('<script> inline sem marcador acusa', () => {
    expect(motivos('<script type="module">console.log(1)</script>')).toHaveLength(1);
  });

  it('marcador fora da lista acusa', () => {
    expect(motivos('<script data-script="outro">x()</script>')).toHaveLength(1);
  });
});

describe('página estática: casos permitidos', () => {
  it('script do menu mobile marcado passa', () => {
    expect(motivos('<script data-script="menu-mobile">(() => {})();</script>')).toEqual([]);
  });

  it('JSON-LD passa (não executa)', () => {
    expect(motivos('<script type="application/ld+json">{"@type":"Organization"}</script>')).toEqual([]);
  });

  it('script dentro de comentário não conta', () => {
    expect(motivos('<!-- <script src="/a.js"></script> -->')).toEqual([]);
  });
});

describe('leitura de CSS e JS das ilhas', () => {
  it('acha as folhas de estilo linkadas', () => {
    expect(folhasDeEstilo('<link rel="stylesheet" href="/_astro/a.css"><link rel="icon" href="/f.png">')).toEqual([
      '/_astro/a.css',
    ]);
  });

  it('acha component-url e renderer-url sem repetir', () => {
    const html =
      '<astro-island component-url="/_astro/A.js" renderer-url="/_astro/client.js"></astro-island>' +
      '<astro-island component-url="/_astro/B.js" renderer-url="/_astro/client.js"></astro-island>';
    expect(urlsDeIlha(html)).toEqual(['/_astro/A.js', '/_astro/client.js', '/_astro/B.js']);
  });

  it('segue imports estáticos relativos do JS minificado', () => {
    expect(importsEstaticos('import{a as b}from"./chunk.X.js";import"./side.Y.js";const c=import("./lazy.js")')).toEqual([
      './chunk.X.js',
      './side.Y.js',
    ]);
  });
});
