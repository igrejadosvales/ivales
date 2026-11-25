import { expect, test, type Page } from '@playwright/test';

const pronto = (page: Page) => page.locator('[data-formulario-pronto="true"]');

// Every volunteer is a member: the form asks the server who is signed in. These mocks answer for it
// (devalue-encoded action responses), so the tests never touch the real database or session.
interface Membro {
  nome?: string;
  telefone?: string;
  nascimento?: string | null;
}

async function comoMembro(page: Page, { nome = 'Maria Silva', telefone = '11987654321', nascimento = '1990-05-10' }: Membro = {}) {
  const perfil = [{ profile: 1 }, { full_name: 2, email: 3, phone: 4, birth_date: 5 }, nome, 'maria@exemplo.com', telefone, nascimento];
  await page.route('**/_actions/members.me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json+devalue', body: JSON.stringify(perfil) }),
  );
  await page.route('**/_actions/volunteers.mine', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json+devalue', body: '[{"volunteer":1},null]' }),
  );
}

async function semConta(page: Page) {
  await page.route('**/_actions/members.me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json+devalue', body: '[{"profile":1},null]' }),
  );
}

async function abrirFormulario(page: Page, membro: Membro = {}) {
  await comoMembro(page, membro);
  await page.goto('/voluntarios/cadastro');
  await pronto(page).waitFor();
  await expect(page.getByRole('heading', { level: 3, name: 'Seus dados' })).toBeVisible();
}

// Name and e-mail come from the member account (read-only); phone and birth date are confirmed here.
async function preencherDados(page: Page) {
  await page.getByLabel('WhatsApp').fill('11987654321');
  await page.getByLabel('Data de nascimento').fill('1990-05-10');
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
  test('o endereço antigo /voluntariado leva para /voluntarios', async ({ page }) => {
    await page.goto('/voluntariado');
    await expect(page).toHaveURL(/\/voluntarios$/);
    await expect(page.locator('main h1')).toContainText('Sirva com propósito');
  });

  test('mostra um único h1, os dois caminhos e os três passos', async ({ page }) => {
    await page.goto('/voluntarios');

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

  test('"Quero ser voluntário" abre o cadastro em tela cheia, sem cabeçalho ou rodapé', async ({ page }) => {
    await page.goto('/voluntarios');
    await page.locator('#caminhos').getByRole('link', { name: /Quero ser voluntário/ }).click();
    await expect(page).toHaveURL(/\/voluntarios\/cadastro$/);
    await expect(page.locator('body > header, body > footer')).toHaveCount(0);
  });

  test('o cartão "Já sou voluntário" leva ao login de membros', async ({ page }) => {
    await page.goto('/voluntarios');
    await page.locator('#caminhos').getByRole('link', { name: /Já sou voluntário/ }).click();
    await expect(page).toHaveURL(/\/membros$/);
  });
});

test.describe('cadastro de voluntário', () => {
  test('sem conta: oferece entrar com a conta de membro ou criar uma no próprio cadastro', async ({ page }) => {
    await semConta(page);
    await page.goto('/voluntarios/cadastro');
    await pronto(page).waitFor();

    await expect(page.getByRole('link', { name: 'Entrar com minha conta de membro' })).toHaveAttribute(
      'href',
      '/membros?next=%2Fvoluntarios%2Fcadastro',
    );
    await expect(page.getByText('ou crie sua conta')).toBeVisible();

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByLabel('Nome completo')).toBeFocused();
    await expect(page.getByText('Informe seu nome completo.')).toBeVisible();
    await expect(page.getByText('Crie uma senha para sua conta.')).toBeVisible();
  });

  test('sem conta: e-mail que já tem conta volta para os dados com erro e convite para entrar', async ({ page }) => {
    await semConta(page);
    await page.route('**/_actions/volunteers.create', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'AstroActionError',
          code: 'CONFLICT',
          status: 409,
          message: 'Este e-mail já tem uma conta de membro. Entre com ela para continuar.',
        }),
      }),
    );
    await capturarWhatsApp(page);
    await page.goto('/voluntarios/cadastro');
    await pronto(page).waitFor();

    await page.getByLabel('Nome completo').fill('Maria Silva');
    await page.getByLabel('E-mail').fill('maria@exemplo.com');
    await page.getByLabel('Crie uma senha').fill('senha-segura');
    await preencherDados(page);
    await page.getByRole('checkbox', { name: /Ainda não sei onde servir/ }).check();
    await page.getByRole('button', { name: 'Revisar cadastro' }).click();
    await page.getByRole('checkbox', { name: /Autorizo a Igreja/ }).check();
    await page.getByRole('button', { name: 'Voluntariar' }).click();

    await expect(page.getByRole('heading', { level: 3, name: 'Seus dados' })).toBeVisible();
    await expect(page.getByText('Este e-mail já tem uma conta de membro.')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeFocused();
    await expect(page.getByRole('link', { name: 'Entrar com essa conta' })).toBeVisible();
  });

  test('membro: usa a conta (sem pedir nome, e-mail ou senha) e valida o que falta', async ({ page }) => {
    await abrirFormulario(page, { telefone: '', nascimento: null });

    await expect(page.getByText('maria@exemplo.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Não é você? Trocar de conta' })).toBeVisible();
    await expect(page.getByLabel('Nome completo')).toHaveCount(0);
    await expect(page.getByLabel('Crie uma senha')).toHaveCount(0);

    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByRole('alert')).toContainText('Confira os campos destacados');
    await expect(page.getByLabel('WhatsApp')).toBeFocused();
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
    // Mock the action so the test never writes to the real database (devalue-encoded `{ ok: true }`).
    await page.route('**/_actions/volunteers.create', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json+devalue', body: '[{"ok":1},true]' }),
    );
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
    await page.getByRole('button', { name: 'Voluntariar' }).click();
    await expect(page.getByRole('alert')).toContainText('Autorize o contato');
    await expect(page.getByRole('checkbox', { name: /Autorizo a Igreja/ })).toBeFocused();
    expect(await page.evaluate(() => (window as Window & { __urlWhatsApp?: string }).__urlWhatsApp)).toBe('');

    await page.getByRole('checkbox', { name: /Autorizo a Igreja/ }).check();
    await page.getByRole('button', { name: 'Voluntariar' }).click();

    await expect(page.getByRole('heading', { level: 3, name: 'Cadastro enviado!' })).toBeVisible();

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
    await abrirFormulario(page, { nome: 'João Santos', telefone: '' });
    await preencherDados(page);

    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Seus dados' })).toBeVisible();
    await expect(page.getByText('João Santos')).toBeVisible();
    await expect(page.getByLabel('WhatsApp')).toHaveValue('(11) 98765-4321');
  });
});
