# Marca e acessibilidade

## Logo
- Usa só o ícone da pomba em branco: `public/brand/simbolo-branco.png`.
- Aparece no cabeçalho, no rodapé e no favicon (`favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`).
- Não usar logo com texto nem em cor.
- O arquivo original (`iVales.ai`) não está no repositório.

## Cor da marca
- Logo: a pomba laranja (cor medida no PNG) é a marca; o azul #1D5FD6 é a cor de tema (`accent`).
- Botão primário: azul com texto branco (`on-accent`, 5,74:1). Na faixa azul, borda branca para a forma aparecer.

## Contraste (WCAG AA)
- Texto sobre fundo: mínimo 4,5:1. Pares testados em `src/styles/tokens.test.ts`.
- Anel de foco contra o fundo: mínimo 3:1 (WCAG 1.4.11).
- Textos de apoio usam cinzas opacos (`ink-muted`, #b6b6b6) para o contraste ficar fixo.

## Acessibilidade
- Foco visível em todos os elementos interativos.
- Link "Pular para o conteúdo" no início de cada página.
- Imagens com `alt` descritivo. Ícone decorativo com `aria-hidden="true"`.
- Accordion e menu funcionam sem depender de mouse.

## Fontes
- DM Sans vem de `@fontsource-variable/dm-sans` (autohospedada).
