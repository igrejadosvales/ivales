import { describe, expect, it } from 'vitest';
import {
  encontrarNoCss,
  encontrarNoHtml,
  encontrarNoJs,
  encontrarNoTexto,
  encontrarReferencias,
} from './check-no-external';

const urls = (achados: { url: string }[]) => achados.map((a) => a.url);

describe('HTML: casos que devem acusar externo', () => {
  it('<use href> externo', () => {
    expect(urls(encontrarNoHtml('<svg><use href="https://cdn.exemplo.com/sprite.svg#a"/></svg>'))).toEqual([
      'https://cdn.exemplo.com/sprite.svg#a',
    ]);
  });

  it('<input type=image src> externo', () => {
    expect(urls(encontrarNoHtml('<input type="image" src="https://exemplo.com/b.png">'))).toEqual([
      'https://exemplo.com/b.png',
    ]);
  });

  it('<base href> externo', () => {
    expect(urls(encontrarNoHtml('<base href="https://exemplo.com/">'))).toEqual(['https://exemplo.com/']);
  });

  it('@import dentro de <style> no HTML', () => {
    expect(urls(encontrarNoHtml('<style>@import "https://fontes.exemplo.com/f.css";</style>'))).toEqual([
      'https://fontes.exemplo.com/f.css',
    ]);
  });

  it('image-set() com string externa dentro de style=""', () => {
    expect(
      urls(encontrarNoHtml(`<div style="background-image: image-set('https://exemplo.com/a.png' 1x)"></div>`)),
    ).toEqual(['https://exemplo.com/a.png']);
  });

  it('<meta http-equiv=refresh> com destino externo', () => {
    expect(urls(encontrarNoHtml('<meta http-equiv="refresh" content="0;url=https://exemplo.com/">'))).toEqual([
      'https://exemplo.com/',
    ]);
  });

  it('atributo ping externo, inclusive com mais de uma URL', () => {
    expect(
      urls(encontrarNoHtml('<a href="/local" ping="https://rastreio.exemplo.com/p https://outro.exemplo.com/p">x</a>')),
    ).toEqual(['https://rastreio.exemplo.com/p', 'https://outro.exemplo.com/p']);
  });

  it('src sem aspas', () => {
    expect(urls(encontrarNoHtml('<img src=https://exemplo.com/a.png>'))).toEqual(['https://exemplo.com/a.png']);
  });

  it('">" dentro de alt não quebra a leitura da tag', () => {
    expect(urls(encontrarNoHtml('<img alt="a > b" src="https://exemplo.com/a.png">'))).toEqual([
      'https://exemplo.com/a.png',
    ]);
  });

  it('entidade numérica escondendo o esquema', () => {
    expect(urls(encontrarNoHtml('<a href="/ok"><img src="&#104;ttps://exemplo.com/a.png"></a>'))).toEqual([
      'https://exemplo.com/a.png',
    ]);
  });

  it('escape CSS escondendo o esquema dentro de <style>', () => {
    expect(urls(encontrarNoHtml('<style>.a{background:url("\\68ttps://exemplo.com/a.png")}</style>'))).toEqual([
      'https://exemplo.com/a.png',
    ]);
  });

  it('action de formulário e formaction externos', () => {
    expect(urls(encontrarNoHtml('<form action="https://exemplo.com/enviar"><button formaction="https://outro.exemplo.com/x">ok</button></form>'))).toEqual([
      'https://exemplo.com/enviar',
      'https://outro.exemplo.com/x',
    ]);
  });

  it('script inline com fetch para domínio externo', () => {
    expect(urls(encontrarNoHtml('<script>fetch("https://api.exemplo.com/dados")</script>'))).toEqual([
      'https://api.exemplo.com/dados',
    ]);
  });

  it('<script src> e <link rel=stylesheet> externos', () => {
    const html = '<script src="https://cdn.exemplo.com/a.js"></script><link rel="stylesheet" href="https://fontes.exemplo.com/x.css">';
    expect(urls(encontrarNoHtml(html))).toEqual(['https://cdn.exemplo.com/a.js', 'https://fontes.exemplo.com/x.css']);
  });

  it('srcset externo', () => {
    expect(urls(encontrarNoHtml('<img srcset="https://a.exemplo.com/1.png 1x, /local.png 2x" src="/local.png">'))).toEqual([
      'https://a.exemplo.com/1.png',
    ]);
  });

  it('poster, data, embed, iframe, background externos', () => {
    const html = [
      '<video poster="https://exemplo.com/p.jpg"></video>',
      '<object data="https://exemplo.com/o.swf"></object>',
      '<embed src="https://exemplo.com/e.swf">',
      '<iframe src="https://exemplo.com/f"></iframe>',
      '<body background="https://exemplo.com/bg.png">',
    ].join('');
    expect(urls(encontrarNoHtml(html))).toEqual([
      'https://exemplo.com/p.jpg',
      'https://exemplo.com/o.swf',
      'https://exemplo.com/e.swf',
      'https://exemplo.com/f',
      'https://exemplo.com/bg.png',
    ]);
  });
});

describe('HTML: casos permitidos (não acusam)', () => {
  it('<a href> para rede social é navegação', () => {
    expect(encontrarNoHtml('<a href="https://instagram.com/igreja">Instagram</a>')).toEqual([]);
  });

  it('<link rel=canonical> e alternate são metadado', () => {
    expect(
      encontrarNoHtml(
        '<link rel="canonical" href="https://igrejadosvales.com.br/contato"><link rel="alternate" href="https://igrejadosvales.com.br/feed">',
      ),
    ).toEqual([]);
  });

  it('namespace SVG e <use href> local', () => {
    expect(
      encontrarNoHtml('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use href="#icone"/></svg>'),
    ).toEqual([]);
  });

  it('recursos locais e data: não acusam', () => {
    const html = [
      '<img src="/placeholders/hero.svg" alt="">',
      '<script src="/_astro/a.js"></script>',
      '<link rel="stylesheet" href="/_astro/index.css">',
      '<div style="background:url(data:image/svg+xml;base64,AAAA)"></div>',
      '<meta http-equiv="refresh" content="0;url=/contato">',
    ].join('');
    expect(encontrarNoHtml(html)).toEqual([]);
  });

  it('URL externa dentro de comentário HTML não é carregada', () => {
    expect(encontrarNoHtml('<!-- <img src="https://exemplo.com/a.png"> -->')).toEqual([]);
  });
});

describe('CSS', () => {
  it('@import e url() externos', () => {
    const css = '@import url(https://fontes.exemplo.com/a.css);\n.x{background:url("https://img.exemplo.com/b.png")}';
    expect(urls(encontrarNoCss(css))).toEqual(['https://fontes.exemplo.com/a.css', 'https://img.exemplo.com/b.png']);
  });

  it('image-set() com string externa', () => {
    expect(urls(encontrarNoCss(".x{background-image:image-set('https://exemplo.com/a.png' 1x)}"))).toEqual([
      'https://exemplo.com/a.png',
    ]);
  });

  it('url() local e data: passam', () => {
    expect(encontrarNoCss('@font-face{src:url(/_astro/inter.woff2)} .b{background:url(data:image/png;base64,AA)}')).toEqual(
      [],
    );
  });
});

describe('JS e texto', () => {
  it('string literal com URL externa em JS', () => {
    expect(urls(encontrarNoJs('const u = "https://exemplo.com/x.js"; import(`//cdn.exemplo.com/m.js`);'))).toEqual([
      'https://exemplo.com/x.js',
      '//cdn.exemplo.com/m.js',
    ]);
  });

  it('namespace SVG em JS passa', () => {
    expect(encontrarNoJs('document.createElementNS("http://www.w3.org/2000/svg", "svg")')).toEqual([]);
  });

  it('texto de erro do React ("https://react.dev/errors/" + código) passa só em JS e só exato', () => {
    expect(encontrarNoJs('var t=`https://react.dev/errors/`+e;')).toEqual([]);
    expect(urls(encontrarNoJs('fetch("https://react.dev/errors/418")'))).toEqual(['https://react.dev/errors/418']);
    expect(urls(encontrarNoJs('import("https://react.dev/x.js")'))).toEqual(['https://react.dev/x.js']);
    expect(urls(encontrarNoHtml('<script src="https://react.dev/errors/"></script>'))).toEqual(['https://react.dev/errors/']);
  });

  it('json com URL externa acusa', () => {
    expect(urls(encontrarNoTexto('{"icons":[{"src":"https://exemplo.com/i.png"}]}'))).toEqual(['https://exemplo.com/i.png']);
  });

  it('txt com URL externa acusa; xml com namespace passa', () => {
    expect(urls(encontrarNoTexto('Veja https://exemplo.com/doc'))).toEqual(['https://exemplo.com/doc']);
    expect(encontrarNoTexto('<svg xmlns="http://www.w3.org/2000/svg"/>')).toEqual([]);
  });
});

describe('despacho por extensão', () => {
  it('verifica html, svg, css, js, json e webmanifest', () => {
    expect(encontrarReferencias('a.svg', '<image href="https://exemplo.com/i.png"/>')).toHaveLength(1);
    expect(encontrarReferencias('a.css', '@import "https://exemplo.com/c.css";')).toHaveLength(1);
    expect(encontrarReferencias('a.mjs', 'fetch("https://exemplo.com/d")')).toHaveLength(1);
    expect(encontrarReferencias('a.json', '{"u":"https://exemplo.com/e"}')).toHaveLength(1);
    expect(encontrarReferencias('site.webmanifest', '{"icons":[{"src":"https://exemplo.com/f"}]}')).toHaveLength(1);
  });

  it('binário não é lido como texto', () => {
    expect(encontrarReferencias('fonte.woff2', 'https://exemplo.com/nao-lido')).toEqual([]);
  });
});

describe('próprio domínio, JSON-LD e tiles do mapa', () => {
  it('URL do próprio site (ivales.org) não é terceiro', () => {
    expect(encontrarNoTexto('<loc>https://ivales.org/sobre</loc>')).toEqual([]);
    expect(encontrarNoHtml('<img src="https://ivales.org/images/a.jpg">')).toEqual([]);
  });

  it('subdomínio parecido não passa', () => {
    expect(urls(encontrarNoHtml('<img src="https://ivales.org.exemplo.com/a.jpg">'))).toEqual([
      'https://ivales.org.exemplo.com/a.jpg',
    ]);
  });

  it('corpo de <script type="application/ld+json"> é dado, não carregamento', () => {
    expect(
      encontrarNoHtml('<script type="application/ld+json">{"sameAs":["https://www.instagram.com/ivalesonline/"]}</script>'),
    ).toEqual([]);
  });

  it('<script> comum com URL externa continua acusando', () => {
    expect(urls(encontrarNoHtml('<script>fetch("https://exemplo.com/x")</script>'))).toEqual(['https://exemplo.com/x']);
  });

  it('JS pode citar o tile server do mapa, e só ele', () => {
    expect(encontrarNoJs('L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png")')).toEqual([]);
    expect(encontrarNoJs('"https://outro.openstreetmap.org/a"')).toHaveLength(1);
  });
});
