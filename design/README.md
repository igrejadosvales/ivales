# Regras de design: Igreja dos Vales (iVales)

Fonte: README.md, src/styles/global.css, src/styles/tokens.test.ts e src/components/ui/. Se algo aqui divergir do código, vale o código, e este arquivo deve ser atualizado.

Arquivos desta pasta:
- `tokens.md`: cores, tipografia, espaçamento, raios e foco (valores exatos de global.css).
- `componentes.md`: regras de uso de Button, Card, Section, Hero, Accordion, VideoEmbed e Container.
- `marca-e-acessibilidade.md`: logo, uso das cores do logo e do azul de tema, contraste WCAG e regras de acessibilidade.

## Regras gerais

- Site estático, sem Google Fonts, sem iframe de terceiros e sem script externo. Imagens e vídeos são locais.
- Estilo: fundo quase preto, texto branco, botão primário branco com texto preto, um único destaque azul. Referência visual: elevationchurch.org (cores medidas pelo CSS computado). Fontes, logo, textos e imagens são da iVales.
- Uma família só: DM Sans, em títulos e texto. A hierarquia vem de peso e tamanho.
- Texto sobre fundo precisa de contraste mínimo 4,5:1 (WCAG AA). Teste automático em `src/styles/tokens.test.ts`.
- Todo elemento interativo tem foco visível. O link "Pular para o conteúdo" existe em todas as páginas.
- Cada seção tem `py-secao` (4rem) ou `lg:py-secao-lg` (6rem) de espaçamento vertical.
- Azul (accent) é a cor principal: botão primário e faixa. Como texto sobre o claro, use accent-text.
- Antes de subir mudança visual, rode `npm run verify` (check, test, build, check:external) e `npm run test:e2e` se mexer em navegação, foco ou vitrine.
- A página `/design` é só de desenvolvimento (noindex) e é removida do build.
