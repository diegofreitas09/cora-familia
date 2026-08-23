const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('coraFamiliaAcessoV1', JSON.stringify({
      tipo: 'familia',
      aluno: 'Teste CI',
      serie: '6º Ano - Manhã',
      responsavel: 'CI',
      expiresAt: Date.now() + 60 * 60 * 1000
    }));
  });
});

test('carrega o Cora Família e abre o orçamento', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header h1')).toHaveText('Cora Família');
  await expect(page.locator('#nav')).toBeVisible();
  await page.locator("#nav button[data-tab='orcamento']").click();
  await expect(page.locator('#orcamento')).toHaveClass(/active/);
  await expect(page.locator('#serieSel')).toBeVisible();
  await expect(page.locator('#downloadQuotePdf')).toBeVisible();
});

test('mantém valores essenciais do orçamento em formato monetário', async ({ page }) => {
  await page.goto('/');
  await page.locator("#nav button[data-tab='orcamento']").click();
  await expect(page.locator('#primeiraVal')).toContainText('R$');
  await expect(page.locator('#anuidadeVal')).toContainText('R$');
  const first = await page.locator('#primeiraVal').innerText();
  expect(first).not.toContain('58.000.000');
});
