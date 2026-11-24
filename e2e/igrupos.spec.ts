import { expect, test } from '@playwright/test';

test.describe('/igrupos', () => {
  test('busca, filtros e seleção', async ({ page }) => {
    await page.goto('/igrupos');
    const lista = page.getByRole('complementary', { name: 'Buscar iGrupos' });
    await expect(lista.getByText('14 iGrupos')).toBeVisible();

    await lista.getByRole('searchbox').fill('eliezer');
    await expect(lista.getByText('1 de 14 iGrupos')).toBeVisible();
    await lista.getByRole('button', { name: /Eliézer e Fernanda/ }).click();
    await expect(lista.getByRole('link', { name: 'WhatsApp Eliézer' })).toHaveAttribute('href', /wa\.me\/5551998725711/);

    await lista.getByRole('button', { name: 'Limpar filtros' }).click();
    await lista.getByRole('button', { name: 'Canoas', exact: true }).click();
    await lista.getByRole('button', { name: 'Sexta', exact: true }).click();
    await expect(lista.getByText('1 de 14 iGrupos')).toBeVisible();
    await expect(lista.getByText('Wellington e Ester').first()).toBeVisible();
  });

  test('mapa carrega', async ({ page }) => {
    await page.goto('/igrupos');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.igrupo-pin')).toHaveCount(13);
  });
});
