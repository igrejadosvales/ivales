import { expect, test } from '@playwright/test';

// O menu mobile é <details>/<summary>: o estado "aberto" é o atributo open.
const botao = (page: import('@playwright/test').Page) => page.locator('#menu-toggle');
const detalhes = (page: import('@playwright/test').Page) => page.locator('header details');
const menu = (page: import('@playwright/test').Page) => page.locator('#menu-mobile');

test.describe('menu mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('abre e fecha pelo botão; Escape fecha e devolve o foco ao botão', async ({ page }) => {
    await page.goto('/');

    await expect(menu(page)).toBeHidden();
    await expect(detalhes(page)).not.toHaveAttribute('open', '');

    await botao(page).click();
    await expect(detalhes(page)).toHaveAttribute('open', '');
    await expect(menu(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(detalhes(page)).not.toHaveAttribute('open', '');
    await expect(menu(page)).toBeHidden();
    await expect(botao(page)).toBeFocused();
  });

  test('o botão "Área de membros" do cabeçalho fica escondido no celular (o do menu aparece ao abrir)', async ({ page }) => {
    await page.goto('/');
    const cabecalho = page.locator('header > div > div');
    await expect(cabecalho.getByRole('link', { name: 'Área de membros' }).first()).toBeHidden();
    await botao(page).click();
    await expect(menu(page).getByRole('link', { name: 'Área de membros' })).toBeVisible();
  });

  test('fecha ao clicar de novo no mesmo botão', async ({ page }) => {
    await page.goto('/');

    await botao(page).click();
    await expect(menu(page)).toBeVisible();

    await botao(page).click();
    await expect(menu(page)).toBeHidden();
    await expect(detalhes(page)).not.toHaveAttribute('open', '');
  });

  test('abre com teclado, foca o primeiro link e fecha com Escape', async ({ page }) => {
    await page.goto('/');

    // Tab a partir do início da página até o botão (passa pelo link "Pular para o conteúdo" e pelo logo).
    for (let i = 0; i < 5 && !(await botao(page).evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(botao(page)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(menu(page)).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(menu(page).getByRole('link', { name: 'Sobre' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu(page)).toBeHidden();
    await expect(botao(page)).toBeFocused();
  });

  test('funciona sem JavaScript: o botão abre o menu e os links aparecem', async ({ browser }) => {
    const contexto = await browser.newContext({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    const page = await contexto.newPage();
    await page.goto('/');

    await botao(page).click();
    await expect(menu(page)).toBeVisible();
    await expect(menu(page).getByRole('link', { name: 'Sobre' })).toBeVisible();

    await contexto.close();
  });
});

test.describe('navegação por teclado no desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('link "Pular para o conteúdo" aparece com Tab e leva ao conteúdo principal', async ({ page }) => {
    await page.goto('/design');

    await page.keyboard.press('Tab');
    const pular = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(pular).toBeFocused();
    await expect(pular).toBeVisible();

    await page.keyboard.press('Enter');
    // Depois de pular, o próximo Tab cai no primeiro elemento focável do conteúdo (o botão do hero).
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Botão de exemplo' })).toBeFocused();
  });

  test('links do menu principal recebem anel de foco visível', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Principal' });
    const primeiro = nav.getByRole('link', { name: 'Sobre' });
    await primeiro.focus();
    await expect(primeiro).toBeFocused();
    await expect(primeiro).toHaveCSS('outline-style', 'solid');
    await expect(primeiro).toHaveCSS('outline-width', '2px');
  });

  test('logo da pomba fica branca no topo escuro/transparente e azul após o hover', async ({ page }) => {
    await page.goto('/');

    const logoHeader = page.locator('header .logo-pomba');
    const iconeHeader = page.locator('header .logo-pomba-icone');

    // No topo da home (header transparente com data-topo), a pomba é branca
    await expect(iconeHeader).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    // Ao passar o mouse (hover), a pomba fica azul (--color-accent)
    await logoHeader.hover();
    await expect.poll(() => iconeHeader.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(29, 95, 214)');

    // No rodapé (data-tom="escuro"), também é branca e fica azul no hover
    const logoFooter = page.locator('footer .logo-pomba');
    const iconeFooter = page.locator('footer .logo-pomba-icone');
    await expect(iconeFooter).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await logoFooter.hover();
    await expect.poll(() => iconeFooter.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(29, 95, 214)');
  });
});
