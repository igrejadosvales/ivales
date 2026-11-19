# Tokens de cor (gerado do src/styles/global.css)

Não editar à mão: o teste `src/styles/tokens.test.ts` confere que estes hex batem com o CSS.

## Base clara (@theme)

| Token | Hex | Uso |
|---|---|---|
| `canvas` | #ffffff | fundo da base clara (branco) |
| `surface` | #f1eee8 | seção elevada, cartão e rodapé claro |
| `border` | #dcd7cc | divisores |
| `border-strong` | #6e684f | contorno em hover (controle) |
| `ink` | #2e2c24 | texto principal |
| `ink-muted` | #595445 | texto de apoio (cinza-oliva da marca) |
| `accent` | #1d5fd6 | botão primário (azul, texto branco) e faixa azul |
| `accent-hover` | #1a4fbf | botão primário em hover |
| `accent-text` | #1d5fd6 | eyebrow, links e ícones sobre o claro |
| `on-accent` | #ffffff | texto e borda branca sobre o azul |
| `focus` | #2e2c24 | anel de foco (base clara) |

## Tom escuro (data-tom="escuro")

Redefine só estes tokens; os demais herdam da base.

| Token | Hex |
|---|---|
| `canvas` | #0a0a0a |
| `surface` | #111111 |
| `border` | #272727 |
| `border-strong` | #858a97 |
| `ink` | #ffffff |
| `ink-muted` | #b6b6b6 |
| `accent-text` | #60a5fa |
| `focus` | #ffffff |

## Faixa azul (data-tom="destaque")

Fundo `accent`. Texto e bordas `on-accent` (branco). Primário: azul com borda branca. Secundário: fundo `on-accent` (branco) com texto `accent` (azul); hover em `surface`. Fantasma: branco. Foco: `on-accent`.
