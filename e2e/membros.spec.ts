import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Área de Membros (/membros)', () => {
  test('exibe somente o portal interativo full-screen, permite entrar no modo demonstração e navegar entre todos os módulos sem violações axe', async ({
    page,
  }) => {
    await page.goto('/membros');

    await expect(page.locator('main h1')).toHaveText('Área de Membros');
    await expect(page.getByRole('heading', { name: 'Entrar na Área de Membros' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tudo para sua caminhada em um só lugar' })).toBeVisible();

    // Entra no painel usando o botão de Modo Demonstração
    await page.getByRole('button', { name: 'Explorar painel (Modo Demonstração)' }).click();

    await expect(page.getByRole('heading', { name: 'Olá, Mateus' })).toBeVisible();
    await expect(page.getByText('50% concluído')).toBeVisible();

    // Verifica acessibilidade do painel logado na Visão Geral
    const axeInicio = await new AxeBuilder({ page }).exclude('astro-dev-toolbar').analyze();
    expect(axeInicio.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);

    // Vai para a aba Jornada IdeAll, inscreve-se em um curso e conclui uma aula
    await page.getByRole('tab', { name: 'Jornada IdeAll' }).click();
    await expect(page.getByRole('heading', { name: 'Jornada IdeAll' })).toBeVisible();
    const cursoOracao = page.getByRole('article').filter({ hasText: 'Vida de Oração' });
    await cursoOracao.getByRole('button', { name: 'Inscrever-me' }).click();
    await cursoOracao.getByRole('button', { name: 'Por que orar' }).click();
    await expect(cursoOracao.getByText('1 de 3 aulas concluídas')).toBeVisible();

    // Vai para a aba Meu iGrupo e confirma presença
    await page.getByRole('tab', { name: 'Meu iGrupo' }).click();
    await page.getByRole('button', { name: 'Confirmar presença no próximo encontro' }).click();
    await expect(page.getByRole('button', { name: 'Presença confirmada nesta semana ✓' })).toBeVisible();

    // Vai para a aba Minhas Escalas
    await page.getByRole('tab', { name: 'Minhas Escalas' }).click();
    await expect(page.getByRole('heading', { name: 'Minhas Próximas Escalas' })).toBeVisible();

    // Vai para a aba Família, inscreve-se no batismo e adiciona um familiar
    await page.getByRole('tab', { name: 'Família' }).click();
    await page.getByRole('button', { name: 'Quero me batizar' }).click();
    await expect(page.getByText('Inscrição para o Batismo registrada com alegria!')).toBeVisible();
    await page.getByLabel('Nome do familiar').fill('Sofia Oliveira');
    await page.getByRole('button', { name: '+ Adicionar à família' }).click();
    await expect(page.getByText('Sofia Oliveira')).toBeVisible();

    // Sai da conta e volta para a tela de acesso
    await page.getByRole('button', { name: 'Sair da conta' }).click();
    await expect(page.getByRole('heading', { name: 'Entrar na Área de Membros' })).toBeVisible();
  });
});
