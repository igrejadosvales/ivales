import { expect, test } from '@playwright/test';

test.describe('vitrine /design', () => {
  test('mostra um único h1 e uma seção por componente', async ({ page }) => {
    await page.goto('/design');

    // Escopo em <main>: o toolbar de dev do Astro também tem h1 no DOM.
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toHaveText('Vitrine de componentes');
    for (const id of ['cores', 'logo', 'tipografia', 'botoes', 'cartoes', 'selos', 'escuro', 'destaque', 'video', 'perguntas', 'container']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test('é marcada como noindex', async ({ page }) => {
    await page.goto('/design');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('accordion abre a resposta ao clicar', async ({ page }) => {
    await page.goto('/design');

    const pergunta = page.getByText('Preciso ser membro para participar?');
    const item = page.locator('details', { has: pergunta });
    await expect(item).not.toHaveAttribute('open', '');
    await pergunta.click();
    await expect(item).toHaveAttribute('open', '');
  });

  // Botões usam o anel da HeroUI (box-shadow: anel na cor --focus, afastado 2 px pela cor de --background).
  // O contraste de --focus contra cada fundo (3:1 ou mais) está em src/styles/tokens.test.ts.
  const focarComTeclado = async (page: import('@playwright/test').Page, nome: string) => {
    const alvo = page.getByRole('link', { name: nome });
    await alvo.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(alvo).toBeFocused();
    return alvo;
  };
  // A HeroUI anima o box-shadow (100 ms): os testes esperam o valor final com expect.poll.
  const anel = (alvo: import('@playwright/test').Locator) =>
    alvo.evaluate((el) =>
      // Tira as sombras vazias que o Tailwind compõe junto (rgba(0, 0, 0, 0) 0px 0px 0px 0px).
      getComputedStyle(el)
        .boxShadow.split(/,(?![^(]*\))/)
        .map((p) => p.trim())
        .filter((p) => !p.startsWith('rgba(0, 0, 0, 0)'))
        .join(', ') || 'none',
    );

  test('anel de foco: tinta escura no tom claro, branco na faixa azul e no tom escuro', async ({ page }) => {
    await page.goto('/design');

    // "<fundo> 0px 0px 0px 2px, <foco> 0px 0px 0px 4px": afastamento na cor do fundo, anel na cor do foco.
    const claro = await focarComTeclado(page, 'Primário (link)');
    await expect.poll(() => anel(claro)).toBe(
      'rgb(255, 255, 255) 0px 0px 0px 2px, rgb(46, 44, 36) 0px 0px 0px 4px',
    );
    const naFaixa = await focarComTeclado(page, 'Botão dentro da faixa');
    await expect.poll(() => anel(naFaixa)).toBe(
      'rgb(29, 95, 214) 0px 0px 0px 2px, rgb(255, 255, 255) 0px 0px 0px 4px',
    );
    const noEscuro = await focarComTeclado(page, 'Primário no escuro');
    await expect.poll(() => anel(noEscuro)).toBe(
      'rgb(10, 10, 10) 0px 0px 0px 2px, rgb(255, 255, 255) 0px 0px 0px 4px',
    );
  });

  test('botão sem foco não tem anel', async ({ page }) => {
    await page.goto('/design');
    expect(await anel(page.getByRole('link', { name: 'Primário (link)' }))).toBe('none');
  });

  test('faixa azul: primário azul com borda branca; secundário branco com texto azul; fantasma branco', async ({ page }) => {
    await page.goto('/design');

    const primario = page.getByRole('link', { name: 'Primário na faixa' });
    await expect(primario).toHaveCSS('background-color', 'rgb(29, 95, 214)');
    await expect(primario).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(primario).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');

    const secundario = page.getByRole('link', { name: 'Botão dentro da faixa' });
    await expect(secundario).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(secundario).toHaveCSS('color', 'rgb(29, 95, 214)');

    const fantasma = page.getByRole('link', { name: 'Fantasma na faixa' });
    await expect(fantasma).toHaveCSS('color', 'rgb(255, 255, 255)');
  });

  test('faixa azul: primário e secundário são visualmente diferentes (fundo e texto trocados)', async ({ page }) => {
    await page.goto('/design');
    const estilo = (nome: string) =>
      page.getByRole('link', { name: nome }).evaluate((el) => {
        const s = getComputedStyle(el);
        return { fundo: s.backgroundColor, texto: s.color };
      });
    const primario = await estilo('Primário na faixa');
    const secundario = await estilo('Botão dentro da faixa');
    expect(primario.fundo).not.toBe(secundario.fundo);
    expect(primario.texto).not.toBe(secundario.texto);
    // Trocados: o fundo de um é o texto do outro.
    expect(primario.fundo).toBe(secundario.texto);
    expect(primario.texto).toBe(secundario.fundo);
  });

  test('faixa azul: anel de foco branco no secundário e no primário (5,7:1 sobre o azul, testado em tokens.test.ts)', async ({ page }) => {
    await page.goto('/design');
    for (const nome of ['Primário na faixa', 'Botão dentro da faixa']) {
      const botao = await focarComTeclado(page, nome);
      await expect.poll(() => anel(botao)).toBe('rgb(29, 95, 214) 0px 0px 0px 2px, rgb(255, 255, 255) 0px 0px 0px 4px');
    }
  });

  test('botão primário na seção escura: azul com texto branco, sem borda branca', async ({ page }) => {
    await page.goto('/design');

    const primario = page.getByRole('link', { name: 'Primário no escuro' });
    await expect(primario).toHaveCSS('background-color', 'rgb(29, 95, 214)');
    await expect(primario).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(primario).toHaveCSS('border-top-color', 'rgb(29, 95, 214)');
  });
});

test.describe('tema da HeroUI por tom (data-tom)', () => {
  test('as variáveis da HeroUI seguem os tokens de cada tom', async ({ page }) => {
    await page.goto('/design');
    const ler = (seletor: string) =>
      page.locator(seletor).first().evaluate((el) => {
        const s = getComputedStyle(el);
        const v = (n: string) => s.getPropertyValue(n).trim().toLowerCase();
        return { fundo: v('--background'), texto: v('--foreground'), accent: v('--accent'), foco: v('--focus'), botao: v('--accent-foreground') };
      });

    expect(await ler('html')).toEqual({ fundo: '#ffffff', texto: '#2e2c24', accent: '#1d5fd6', foco: '#2e2c24', botao: '#ffffff' });
    expect(await ler('#escuro')).toEqual({ fundo: '#0a0a0a', texto: '#ffffff', accent: '#1d5fd6', foco: '#ffffff', botao: '#ffffff' });
    expect(await ler('#destaque')).toEqual({ fundo: '#1d5fd6', texto: '#ffffff', accent: '#1d5fd6', foco: '#ffffff', botao: '#ffffff' });
  });
});

test.describe('fonte carregada', () => {
  test('document.fonts tem a DM Sans carregada e o corpo a usa', async ({ page }) => {
    await page.goto('/design');
    const resultado = await page.evaluate(async () => {
      await document.fonts.ready;
      const carregadas = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family);
      return { dmCarregada: carregadas.some((f) => f.includes('DM Sans')), corpo: getComputedStyle(document.body).fontFamily };
    });
    expect(resultado.dmCarregada).toBe(true);
    expect(resultado.corpo).toContain('DM Sans');
  });
});
