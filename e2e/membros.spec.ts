import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const semViolacoesGraves = async (page: import('@playwright/test').Page) => {
  const axe = await new AxeBuilder({ page }).exclude('astro-dev-toolbar').analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
};

test.describe('Área de Membros', () => {
  test('/membros: tela cheia com login, sem demonstração, cabeçalho ou rodapé', async ({ page }) => {
    await page.goto('/membros');
    await expect(page.locator('main h1')).toHaveText('Área de Membros');
    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Demonstração/ })).toHaveCount(0);
    await expect(page.locator('body > header, body > footer')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Voltar ao site' })).toHaveAttribute('href', '/');
  });

  test('/membros/demo: painel com dados fictícios, sem família, e saída para o login', async ({ page }) => {
    await page.goto('/membros/demo');
    await expect(page.getByText('Modo demonstração.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Olá, Mateus' })).toBeVisible();
    await semViolacoesGraves(page);

    await page.getByRole('tab', { name: 'Meus dados' }).click();
    await expect(page.getByRole('heading', { name: 'Meus Dados de Membro' })).toBeVisible();
    await expect(page.getByText('Minha Família')).toHaveCount(0);

    await page.getByRole('link', { name: 'Sair da demonstração' }).click();
    await expect(page).toHaveURL(/\/membros$/);
    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
  });

  test('/membros: valida cada campo, foca o primeiro erro e alterna para o cadastro', async ({ page }) => {
    await page.goto('/membros');
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByLabel('E-mail')).toBeFocused();
    await expect(page.getByText('Informe seu e-mail.')).toBeVisible();
    await expect(page.getByText('Informe sua senha.')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('E-mail').fill('sem-arroba');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByText('Confira o e-mail: falta o @ ou o domínio.')).toBeVisible();

    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
    await expect(page.getByLabel('Nome completo')).toBeVisible();
  });

  test('/membros/demo: abas navegáveis por setas', async ({ page }) => {
    await page.goto('/membros/demo');
    // O Astro tira o atributo "ssr" da ilha quando ela hidrata; antes disso o teclado não tem efeito.
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
    await page.getByRole('tab', { name: 'Visão Geral' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Jornada IdeAll' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Meus dados' })).toBeFocused();
  });
});
