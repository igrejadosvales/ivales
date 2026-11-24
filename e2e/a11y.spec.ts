import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROTAS } from './rotas';

// axe em todas as rotas, desktop e celular. Falha com violação "serious" ou "critical".
// A barra de dev do Astro (astro-dev-toolbar) não é do site e fica de fora.
for (const [nome, viewport] of [
  ['desktop', { width: 1280, height: 800 }],
  ['celular', { width: 390, height: 844 }],
] as const) {
  test.describe(`axe (${nome})`, () => {
    test.use({ viewport });
    for (const rota of ROTAS) {
      test(`${rota} sem violações sérias ou críticas`, async ({ page }) => {
        // Reduced motion turns off entrance animations, so axe never measures text mid-fade.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(rota);
        await page.evaluate(() => document.fonts.ready);
        const resultado = await new AxeBuilder({ page }).exclude('astro-dev-toolbar').analyze();
        const graves = resultado.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        expect(graves).toEqual([]);
      });
    }
  });
}

test('legendas do logo na vitrine: contraste AA sobre o fundo claro da seção', async ({ page }) => {
  await page.goto('/design');
  const resultado = await new AxeBuilder({ page }).include('#logo').withRules(['color-contrast']).analyze();
  expect(resultado.violations).toEqual([]);
  // A legenda da pomba branca usa a cor de apoio do tom claro, não a do escuro.
  const legenda = page.getByText('simbolo-branco.png: rodapé e seções escuras.');
  await expect(legenda).toHaveCSS('color', 'rgb(89, 84, 69)');
});
