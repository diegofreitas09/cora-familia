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

test('bloqueia catálogo sem aprovação e publicação explícitas', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const isAuthorized = window.CoraFamiliaGestaoSync?.isAuthorized;
    if (typeof isAuthorized !== 'function') return { available: false };
    return {
      available: true,
      empty: isAuthorized({}),
      onlyApproved: isAuthorized({ Status: 'APROVADO' }),
      onlyPublished: isAuthorized({ 'Publicado no Cora Família': 'SIM' }),
      approvedAndPublished: isAuthorized({ Status: 'APROVADO', 'Publicado no Cora Família': 'SIM' }),
      draft: isAuthorized({ Status: 'RASCUNHO', 'Publicado no Cora Família': 'NÃO' })
    };
  });
  expect(result.available).toBe(true);
  expect(result.empty).toBe(false);
  expect(result.onlyApproved).toBe(false);
  expect(result.onlyPublished).toBe(false);
  expect(result.approvedAndPublished).toBe(true);
  expect(result.draft).toBe(false);
});

