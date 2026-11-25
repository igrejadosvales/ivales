import { expect, test, type Page } from '@playwright/test';

const pronto = (page: Page) => page.locator('[data-formulario-pronto="true"]');

async function abrirFormulario(page: Page) {
  await page.goto('/voluntariado');
  await pronto(page).waitFor();
  await page.locator('#cadastro').scrollIntoViewIfNeeded();
}

async function preencherDados(page: Page, nome = 'Maria Silva') {
  await page.getByLabel('Nome completo').fill(nome);
  await page.getByLabel('E-mail').fill('maria@exemplo.com');
  await page.getByLabel('WhatsApp').fill('11987654321');
  await page.getByLabel('Data de nascimento').fill('1990-05-10');
  await page.getByLabel('Escolaridade').selectOption('superior');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { level: 3, name: 'Encontre sua área' })).toBeVisible();
}

// Troca window.open para capturar a URL sem abrir o WhatsApp de verdade.
async function capturarWhatsApp(page: Page) {
  await page.addInitScript(() => {
    type ComUrl = Window & { __urlWhatsApp?: string };
    (window as ComUrl).__urlWhatsApp = '';
    window.open = ((url?: string | URL) => {
      (window as ComUrl).__urlWhatsApp = String(url ?? '');
      return null;
    }) as typeof window.open;
  });
}

test.describe('landing de voluntariado', () => {
  test('o endereço antigo /voluntarios leva para /voluntariado', async ({ page }) => {
    await page.goto('/voluntarios');
    await expect(page).toHaveURL(/\/voluntariado$/);
    await expect(page.locator('main h1')).toContainText('Sirva com propósito');
  });

  test('mostra um único h1, os dois caminhos e os três passos', async ({ page }) => {
    await page.goto('/voluntariado');

    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toContainText('Sirva com propósito');
    await expect(page.getByRole('heading', { level: 2, name: 'Por onde começar?' })).toBeVisible();
    await expect(page.locator('#caminhos').getByRole('link', { name: /Quero ser voluntário/ })).toBeVisible();
    await expect(page.locator('#caminhos').getByRole('link', { name: /Já sou voluntário/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Como funciona?' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Conheça as áreas' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Cadastre-se' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Comece a servir' })).toBeVisible();
  });

  test('o cartão "Já sou voluntário" leva ao aviso da área', async ({ page }) => {
    await page.goto('/voluntariado');
    await page.locator('#caminhos').getByRole('link', { name: /Já sou voluntário/ }).click();
    await expect(page.locator('#area-voluntario')).toBeInViewport();
    await expect(page.locator('#area-voluntario')).toContainText('Em breve');
  });
});

test.describe('cadastro de voluntário', () => {
  test('valida os campos obrigatórios e foca o primeiro erro', async ({ page }) => {
    await abrirFormulario(page);

    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('alert')).toContainText('Confira os campos destacados');
    await expect(page.getByLabel('Nome completo')).toBeFocused();
    await expect(page.getByText('Informe seu nome completo.')).toBeVisible();
    await expect(page.getByText('Informe seu e-mail.')).toBeVisible();
    await expect(page.getByText('Informe seu WhatsApp com DDD.')).toBeVisible();
    await expect(page.getByText('Informe sua data de nascimento.')).toBeVisible();
  });

  test('exige uma área ou pedido de orientação', async ({ page }) => {
    await abrirFormulario(page);
    await preencherDados(page);

    await page.getByRole('button', { name: 'Revisar cadastro' }).click();

    await expect(page.getByRole('alert')).toContainText('Escolha uma área ou peça orientação');
    await expect(page.locator('fieldset')).toBeFocused();

    await page.getByRole('checkbox', { name: /Ainda não sei onde servir/ }).check();
    await page.getByRole('button', { name: 'Revisar cadastro' }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Confirme seus dados' })).toBeVisible();
  });

  test('percorre dados, áreas e confirmação até o resumo do WhatsApp', async ({ page }) => {
    await capturarWhatsApp(page);
    await abrirFormulario(page);

    await preencherDados(page);

    // Filtro e seleção de duas áreas. O clique é no texto do cartão (label), como uma pessoa faria.
    const cartoes = page.locator('fieldset');
    await page.getByRole('button', { name: 'Louvor', exact: true }).click();
    await cartoes.getByText('Louvor e Adoração', { exact: true }).click();
    await page.getByRole('button', { name: 'Todas', exact: true }).click();
    await cartoes.getByText('Recepção', { exact: true }).click();
    await expect(page.getByText('2 áreas selecionadas.')).toBeVisible();

    await page.getByRole('button', { name: 'Revisar cadastro' }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Confirme seus dados' })).toBeVisible();
    await expect(page.getByText('maria@exemplo.com')).toBeVisible();
    await expect(page.getByText('Louvor e Adoração')).toBeVisible();
    await expect(page.getByText('Recepção')).toBeVisible();

    // Sem consentimento, não abre o WhatsApp.
    await page.getByRole('button', { name: 'Abrir WhatsApp com resumo' }).click();
    await expect(page.getByRole('alert')).toContainText('Autorize o contato');
    await expect(page.getByRole('checkbox', { name: /Autorizo a Igreja/ })).toBeFocused();
    expect(await page.evaluate(() => (window as Window & { __urlWhatsApp?: string }).__urlWhatsApp)).toBe('');

    await page.getByRole('checkbox', { name: /Autorizo a Igreja/ }).check();
    await page.getByRole('button', { name: 'Abrir WhatsApp com resumo' }).click();

    await expect(page.getByRole('heading', { level: 3, name: 'Mensagem pronta!' })).toBeVisible();

    const url = await page.evaluate(() => (window as Window & { __urlWhatsApp?: string }).__urlWhatsApp ?? '');
    expect(url.startsWith('https://wa.me/5551993943907?text=')).toBe(true);
    const texto = decodeURIComponent(url.split('text=')[1] ?? '');
    expect(texto).toContain('Maria Silva');
    expect(texto).toContain('maria@exemplo.com');
    expect(texto).toContain('(11) 98765-4321');
    expect(texto).toContain('Louvor e Adoração, Recepção');

    const link = page.getByRole('link', { name: 'Abrir WhatsApp novamente' });
    await expect(link).toHaveAttribute('href', /^https:\/\/wa\.me\/5551993943907\?text=/);
  });

  test('voltar preserva os dados já preenchidos', async ({ page }) => {
    await abrirFormulario(page);
    await preencherDados(page, 'João Santos');

    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Seus dados' })).toBeVisible();
    await expect(page.getByLabel('Nome completo')).toHaveValue('João Santos');
  });
});
