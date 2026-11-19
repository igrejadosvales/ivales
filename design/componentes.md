# Componentes (src/components/ui/)

## Button
- Variantes: `primario` (padrão, fundo branco, texto preto), `secundario` (contorno, texto escuro), `fantasma` (contorno branco de 2px, texto branco).
- Formato: `rounded-full`, altura mínima 40px (`min-h-10`), padding `px-6 py-2`, texto semibold.
- Vira link (`href`) ou botão (`type`: `button` ou `submit`).
- Dentro da faixa de destaque (`data-tom="destaque"`): primário e secundário viram fundo preto (`canvas`) com texto branco. Fantasma vira borda e texto pretos.

## Section
- `tom`: `padrao` (canvas, texto branco), `elevado` (surface), `destaque` (faixa azul, texto branco).
- Usar `destaque` com moderação, para um chamado de atenção.
- Título opcional em h2 com `text-titulo`; eyebrow opcional acima do título.
- `subtitulo` opcional abaixo do título.
- `alinhamento="centro"` centraliza eyebrow, título e subtítulo; o conteúdo do slot mantém o alinhamento que receber.
- Com `id` e `titulo`, o h2 recebe `id="<id>-titulo"` e a seção usa `aria-labelledby`.

## Hero
- Duas colunas em `lg`: texto à esquerda, imagem `aspect-[4/3]` com `object-cover` à direita.
- Imagem com `width`/`height` obrigatórios e `fetchpriority="high"`.
- CTA usa Button primário.

## Card
- Fundo `surface`, borda `border`, `rounded-cartao`, padding `p-6`, hover em `surface-raised`.
- Título h3 `text-xl`. Descrição em `ink-muted`.
- Com `href`, o cartão inteiro vira link (overlay com `after:absolute after:inset-0`).

## Pessoa
- Cartão de pessoa: foto quadrada no topo (`aspect-square`, `object-cover`), nome em h3 `text-xl` e função em `ink-muted`.
- Mesmo estilo do Card: fundo `canvas`, borda `border`, `rounded-cartao`, hover em `border-strong`. Sem JavaScript.
- Sem `foto`, usa o placeholder local `/placeholders/pessoa.svg` com alt "Foto em breve".
- Foto com `width`/`height` obrigatórios e `loading="lazy"` (fica abaixo da dobra).

## Accordion
- Usa `<details>`/`<summary>`: funciona sem JavaScript e com teclado.
- Ícone "+" em `accent-text`, gira 45° quando aberto.
- Resposta em `ink-muted`.

## VideoEmbed
- Só vídeo local (`src`). Sem iframe de YouTube ou Vimeo.
- Sem `src`, mostra o bloco "Vídeo em breve" em `surface-raised`.
- Com `src`, `preload="none"`: o vídeo só carrega ao dar play.
- Proporção `aspect-video`, `rounded-cartao`.

## Container
- `max-w-6xl`, centralizado, com margens laterais responsivas.

## Layout geral
- Cabeçalho, rodapé e menu mobile em `src/components/layout/`. Itens do menu ficam só em `src/lib/navigation.ts`.
- Menu mobile: `aria-expanded` e fecha com Escape.
- Textos de endereço e telefone do rodapé estão como "[a confirmar]" até a confirmação.
