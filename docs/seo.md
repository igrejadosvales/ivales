# SEO e indexação: Igreja dos Vales (ivales.org)

Este guia é para a equipe de comunicação da igreja e para quem cuida do site. A Parte 1 lista o que o site já faz sozinho. A Parte 2 lista as tarefas que precisam de alguém, em ordem de prioridade.

Objetivo: quem procura **"igreja em Gravataí"**, **"igreja no Sarandi"** ou **"pequeno grupo em Canoas"** deve encontrar a Igreja dos Vales no Google, com endereço, horário e um link para o site.

---

## Parte 1: o que o site já faz

| O quê | Onde fica |
|---|---|
| Endereço oficial `https://ivales.org` em todas as páginas (canonical, Open Graph, sitemap) | `SITE_URL` em `src/lib/igreja.ts` |
| Locais, horários dos cultos e redes sociais definidos num lugar só. A home, o Contato, o rodapé e os dados do Google leem daqui | `src/lib/igreja.ts` |
| Dados estruturados para o Google: igreja com os dois locais, endereços e horários; perguntas frequentes (home); trilha de navegação (páginas internas); lista de iGrupos sem rua nem telefone | `src/lib/igreja.ts`, `BaseLayout.astro` |
| `sitemap.xml` com as páginas públicas, e `robots.txt` apontando para ele | `src/pages/sitemap.xml.ts`, `public/robots.txt` |
| A Área de Membros não aparece no Google (`noindex`) | `src/pages/membros.astro`, `vercel.json` |
| Endereços `*.vercel.app` não são indexados, então o Google não vê duas cópias do site | `vercel.json` |
| `www.ivales.org` redireciona para `ivales.org`, e os links antigos (`/voluntarios`, `/contact`, `/biblia`) redirecionam com 301 | `vercel.json` |
| Fotos em AVIF/WebP no tamanho da tela (de 3 MB para no máximo ~250 KB), o que deixa as páginas mais rápidas | `astro:assets` |
| Imagem de compartilhamento de 1200×630 por página (WhatsApp, Instagram, Facebook) | prop `socialImage` |
| Checagem automática a cada build: título, descrição, um `<h1>`, canonical, imagem, JSON-LD e sitemap | `npm run check:seo` |

### Para mudar horário, endereço ou rede social

Edite só `src/lib/igreja.ts` e rode `npm run verify`. O site inteiro e os dados do Google mudam juntos.

### Para uma página nova

1. Passe ao `<BaseLayout>`:
   - `title`: 30 a 65 caracteres com o sufixo " | Igreja dos Vales";
   - `description`: 70 a 160 caracteres, citando a cidade quando fizer sentido;
   - `schema={[schemaBreadcrumb('Nome', '/rota')]}`.
2. Adicione a rota em `ROTAS_DO_SITEMAP` (`src/pages/sitemap.xml.ts`).
3. Rode `npm run verify`. O `check:seo` aponta o que estiver faltando.

---

## Parte 2: tarefas da equipe

### Pendências de dados (bloqueiam a busca local)

Hoje o site usa valores provisórios nestes pontos. Enquanto não forem corrigidos, o telefone fica fora dos dados do Google.

- [x] **Telefone/WhatsApp real**: `(51) 99394-3907`, em `src/lib/contato.ts`.
- [x] **E-mail no domínio novo**: `contato@ivales.org`, em `src/lib/contato.ts` e na home.
- [ ] **CEP** dos dois endereços.
- [ ] **Foto própria do Outside**. Hoje usa uma foto geral de ministérios.

### 1. Quando ivales.org estiver apontando para a Vercel

1. **Vercel:**
   - adicionar `ivales.org` e `www.ivales.org` ao projeto;
   - definir `ivales.org` como domínio principal.
2. **Google Search Console** (search.google.com/search-console):
   - criar uma propriedade do tipo **Domínio** para `ivales.org`;
   - verificar pelo registro TXT no DNS;
   - em **Sitemaps**, enviar `https://ivales.org/sitemap.xml`;
   - em **Inspeção de URL**, testar `https://ivales.org/` e clicar em **Solicitar indexação**. Repetir para `/contato` e `/igrupos`.
3. **Bing Webmaster Tools** (bing.com/webmasters): **Importar do Google Search Console**. Isso também cobre o DuckDuckGo e o Yahoo.
4. **Conferir no terminal:**
   ```sh
   curl -I https://ivales.vercel.app      # deve ter: x-robots-tag: noindex, nofollow
   curl -I https://ivales.org/voluntarios # deve ser 308/301 para /voluntariado
   curl -I https://www.ivales.org         # deve redirecionar para https://ivales.org/
   ```
5. **Site antigo:** se ele ainda estiver em outro domínio (ex.: `igrejadosvales.com.br`):
   - redirecionar o **domínio inteiro** com 301 para `ivales.org`, página por página quando possível;
   - no Search Console do domínio antigo, usar **Configurações → Mudança de endereço**.

### 2. Perfil da Empresa no Google (o que mais traz visitas de quem está perto)

Crie (ou reivindique, se já existir) **um perfil para cada local** em business.google.com:

| Campo | Gravataí | Porto Alegre |
|---|---|---|
| Nome | Igreja dos Vales | Igreja dos Vales Porto Alegre |
| Categoria principal | Igreja evangélica | Igreja evangélica |
| Endereço | Rua Santa Clara, 192, Gravataí - RS | Av. Assis Brasil, 6715, Sarandi, Porto Alegre - RS |
| Horários | Dom 10h, 17h e 20h; Qua 20h | Dom 19h; Qua 20h |
| Site | `https://ivales.org/contato` | `https://ivales.org/contato` |

- **Nome:** não acrescente palavras-chave (ex.: "Igreja dos Vales: a melhor igreja de Gravataí"). O Google pune isso.
- **Fotos reais:** fachada, auditório, culto, kids e estacionamento. Atualize todo mês.
- **Postagens semanais** com o tema do culto, eventos e conferências.
- **Avaliações:** peça aos membros, por exemplo num aviso de culto com QR code, e **responda todas**.

### 3. Nome, endereço e telefone iguais em todo lugar

O Google confia mais quando nome, endereço e telefone são idênticos em todo canal. Quando o telefone real existir, atualize de uma vez:

- [ ] site (`src/lib/igreja.ts` e `src/lib/contato.ts`);
- [ ] os dois Perfis da Empresa no Google;
- [ ] bio do Instagram **@ivalesonline** e **@ivalespoa**, com o link `ivales.org`;
- [ ] YouTube **@ivalesonline**: aba "Sobre" e descrição de cada vídeo com `ivales.org`;
- [ ] Facebook, Apple Maps (Apple Business Connect) e Waze.

### 4. Palavras-chave e conteúdo

Termos que as páginas devem responder (já usados nos títulos e descrições):

| Busca | Página |
|---|---|
| igreja em Gravataí / igreja evangélica Gravataí | Home, Contato |
| igreja no Sarandi / igreja zona norte Porto Alegre / igreja Assis Brasil | Home, Contato |
| culto domingo Gravataí / culto quarta Porto Alegre | Contato |
| pequeno grupo / célula em Porto Alegre, Canoas, Alvorada | iGrupos |
| ministério de jovens / adolescentes / mulheres / homens | Ministérios |

Próximos conteúdos que trazem tráfego, em ordem de impacto:

1. **Página "Primeira visita"** (`/primeira-visita`): o que esperar, kids, estacionamento, como chegar nos dois locais.
2. **Página por local** (`/gravatai` e `/porto-alegre`): endereço, mapa, horários, fotos e líderes. Cada Perfil da Empresa no Google passa a apontar para a página do seu local.
3. **Eventos com data** (conferências, batismos): uma página por evento, com dados estruturados `Event` (data, local, inscrição).
4. **Mensagens**: uma página por série ou pregação, com o vídeo do YouTube e um resumo em texto.

### 5. Links de outros sites

- Instagram e YouTube com o link para `ivales.org`.
- Pedir aos parceiros (a pasta `public/parceiros` lista alguns) um link para o site.
- Cadastros locais: guias de igrejas, prefeitura de Gravataí (agenda cultural) e jornais de bairro.

### 6. Acompanhar (todo mês)

- **Search Console:**
  - Desempenho: quais buscas trazem gente e quais páginas aparecem;
  - Páginas: se alguma ficou fora do índice e por quê;
  - Core Web Vitals.
- **Perfil da Empresa:** quantas pessoas pediram rota ou ligaram.
- **PageSpeed Insights** (pagespeed.web.dev) na home e no Contato depois de mudanças grandes. A meta é verde em celular.
