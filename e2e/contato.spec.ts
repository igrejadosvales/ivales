import { expect, test } from '@playwright/test';

test.describe('página de contato (/contato)', () => {
  test('exibe os canais de atendimento, valida o formulário e prepara a mensagem para o WhatsApp', async ({
    page,
  }) => {
    await page.goto('/contato');

    await expect(page.locator('main h1')).toContainText('Estamos aqui por você');
    await expect(page.getByRole('heading', { name: 'Canais de atendimento' })).toBeVisible();

    // Tenta enviar em branco e verifica validação e foco no primeiro campo
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByText('Informe seu nome completo.')).toBeVisible();
    await expect(page.getByLabel(/Nome completo/)).toBeFocused();

    // Preenche o formulário completo
    await page.getByLabel(/Nome completo/).fill('Lucas Andrade');
    await page.getByLabel(/E-mail/).fill('lucas@exemplo.com');
    await page.getByLabel(/WhatsApp/).fill('11988887777');
    await page.getByLabel(/Assunto/).selectOption('pedido-oracao');
    await page.getByLabel(/Mensagem/).fill('Gostaria de pedir oração pela minha família nesta semana.');

    await page.getByRole('button', { name: 'Enviar mensagem' }).click();

    await expect(page.getByRole('heading', { name: 'Sua mensagem está pronta para envio!' })).toBeVisible();
    await expect(page.getByText('Lucas Andrade')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir WhatsApp novamente' })).toHaveAttribute(
      'href',
      /https:\/\/wa\.me\/5511999999999\?text=/,
    );
  });
});
