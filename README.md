# Igreja dos Vales (iVales)

Site da Igreja dos Vales, feito em Astro 7 com TypeScript, Tailwind v4 e fonte autohospedada (`@fontsource-variable/dm-sans`).

Estado atual: **Fase 1, fundação e design system**. Sem conta externa, sem backend e sem adapter. O site é estático.

## Requisitos

- Node.js 22.23.4 ou superior
- npm (o projeto não usa pnpm)
- Para os testes e2e: navegador Chromium do Playwright (`npx playwright install chromium`, download público)

## Como rodar

```bash
npm install
npm run dev          # http://localhost:4321  (vitrine de componentes: /design)
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento. Inclui a página `/design`. |
| `npm run check` | `astro check`: tipos e erros de `.astro` |
| `npm test` | Vitest: testes unitários (contraste dos tokens, checagem de domínio externo) |
| `npm run test:e2e` | Playwright: menu mobile, navegação por teclado, vitrine e fluxo de voluntariado. Sobe o `astro dev` na porta 4399 e para só o que ele mesmo subiu. Nunca usa a 4321. Se já houver servidor na 4399, reusa e não para. |
| `npm run build` | Gera `dist/` estático. Não inclui `/design`. |
| `npm run check:external` | Confere se `dist/` tenta carregar ou enviar algo a domínio externo (lista de casos abaixo) |
| `npm run verify` | `check` + `test` + `build` + `check:external` (suíte base) |

Para os testes e2e, rode `npx playwright install chromium` uma vez por máquina.

## Estrutura

```
astro.config.mjs        output static, redirects (seção 5 do plano), hook que remove /design do build
src/
  styles/global.css     tokens: cores, tipografia, espaçamento, raios; base de foco
  layouts/BaseLayout    html pt-BR, link "Pular para o conteúdo", cabeçalho e rodapé
  components/ui/        Button, Container, Section, Card, Hero, HeroImersivo, VideoEmbed, Accordion,
                        CartaoAnuncio, CartaoImagem, CartaoIcone
  components/layout/    Header, MobileNav (menu com script mínimo), Footer
  components/islands/   Providers, FormularioVoluntariado (fluxo em etapas)
  lib/navigation.ts     itens do menu (fonte única)
  lib/voluntariado.ts   áreas, escolaridades, validação e resumo do WhatsApp (fonte única)
  pages/index.astro     página inicial: conteúdo do site atual, no nosso design system
  pages/voluntariado.astro  landing + cadastro de voluntário
  pages/design.astro    vitrine de componentes (só dev, noindex)
e2e/                    Playwright
scripts/                check-no-external.ts (+ teste)
public/placeholders/    imagens e vídeo de exemplo locais
```

## Decisões de design

- **Paleta**: tema claro como base. Cor principal: azul `#1D5FD6` (`accent`), com texto branco (`on-accent`) em todos os tons. `canvas` `#FFFFFF`, `surface` `#F1EEE8`, `ink` `#2E2C24`, `ink-muted` `#595445` (cinza-oliva da marca). Seções escuras são tom (`data-tom="escuro"`, texto em `accent-text` azul claro `#60A5FA`). A faixa azul é `data-tom="destaque"`. Os valores completos estão em `design/tokens.md`, gerados do CSS.
- **Contraste**: todos os pares de texto usados passam 4,5:1 em cada tom, conferidos em `src/styles/tokens.test.ts`. Texto branco sobre o azul dá 5,74:1. O azul como texto sobre o claro dá 5,50:1 no canvas e 4,95:1 na superfície. O anel de foco passa 3:1 em cada fundo.
- **Marca**: o logo é a pomba da marca oficial, em laranja da marca (`ivales_-6`, cor medida no PNG) no claro, e em branco (`ivales_-12`) no escuro. Recortada e em PNG otimizada, em `public/brand/`. O laranja existe só nos PNGs do logo: não é cor de tema. O arquivo original (`iVales.ai`) não está no repo.
- **Fontes**: uma família só, DM Sans (`@fontsource-variable/dm-sans`, autohospedada). Títulos e texto usam a mesma família; a hierarquia vem de peso e tamanho. O subset latino cobre os acentos e o cedilha do português.
- **Acessibilidade**: foco visível em todos os elementos interativos, link de pular para o conteúdo, menu mobile com `aria-expanded` e Escape, accordion com `<details>` (funciona sem JavaScript).
- **Sem terceiros no carregamento**: vídeo sem iframe de YouTube/Vimeo; imagens e vídeos são locais.

## Verificação de domínio externo (`check:external`)

Varre todo arquivo de texto do `dist/`: `html`, `htm`, `svg`, `css`, `js`, `mjs`, `cjs`, `json`, `xml`, `txt` e `webmanifest`. Binários (fontes, imagens) não têm texto de referência; o caminho que os referencia já é verificado.

Casos cobertos, cada um com fixture em `scripts/check-no-external.test.ts`:

- **Carregam:** `src`, `srcset`, `poster`, `data`, `background`, `lowsrc`, `dynsrc`, `codebase`, `archive`; `<use href>`, `<base href>`, `<image href>`, `xlink:href` e qualquer `href` que não seja de `<a>`; `<link>` externo (exceto canonical e alternate).
- **Enviam dados ou rastreiam:** `action`, `formaction`, `ping` (uma ou mais URLs).
- **Redirecionam:** `<meta http-equiv="refresh">` com URL externa.
- **Inline:** `style=""`, blocos `<style>` (`@import`, `url()`, `image-set()` com strings) e `<script>` (strings literais com URL externa).
- **Formas de escrita:** valor sem aspas; `>` dentro de aspas (ex.: `alt="a > b"`); entidades numéricas (`&#104;ttps`); escapes CSS (`\68ttps`); `srcset` com vários candidatos.
- **Texto:** URLs `http(s)`, `ws(s)` e `ftp` em JSON, XML, TXT e manifest.

Permitido (não acusa): `<a href>` para fora (navegação, ex.: redes sociais); `<link rel="canonical|alternate">`; comentários HTML; `data:`; namespaces XML e SVG (`http://www.w3.org/...` em `xmlns` ou em JS/texto); URLs locais.

Limite conhecido: o JS só é verificado por strings literais. Uma URL montada por concatenação não é pega.

## Limitações conhecidas

- Os links do menu apontam para páginas que só existem a partir da fase 2 (`/sobre`, `/cultos` etc.). Até lá, dão 404.
- Em build estático sem adapter, os `redirects` viram redirecionamento por `<meta http-equiv="refresh">` (status 200). O status 301 real depende de adapter ou de regra no host, decidido na fase 2 junto com o teste de status.
- Os textos de endereço e telefone no rodapé estão marcados como "[a confirmar]".
- **Voluntariado:** o formulário valida no navegador e monta um resumo, mas nada é enviado nem armazenado pelo site. No fim, a pessoa abre o WhatsApp e envia a mensagem. O número `(11) 99999-9999` é provisório e deve ser trocado em `src/lib/voluntariado.ts` (`WHATSAPP_VOLUNTARIADO`) antes de publicar. O caminho "Já sou voluntário" em `/voluntariado` ainda é um aviso de "em breve"; o cadastro novo é o fluxo completo.

## Fora desta fase

Nada de Sanity, Supabase, Vercel, gateway de pagamento ou Google Fonts. O DNS e o site atual não foram alterados.
