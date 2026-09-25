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

test('catálogo ativo aceita somente APROVADO + SIM', async ({ page }) => {
  await page.route('**/macros/s/**', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('action') === 'listar' && url.searchParams.get('aba') === 'Produtos 2027') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          rows: [
            { ID: 'A', Categoria: 'Mensalidade' },
            { ID: 'B', Categoria: 'Mensalidade', Status: 'APROVADO' },
            { ID: 'C', Categoria: 'Mensalidade', 'Publicado no Cora Família': 'SIM' },
            { ID: 'D', Categoria: 'Mensalidade', Status: 'RASCUNHO', 'Publicado no Cora Família': 'NÃO' },
            { ID: 'E', Categoria: 'Mensalidade', Status: 'APROVADO', 'Publicado no Cora Família': 'SIM' }
          ]
        })
      });
      return;
    }
    await route.continue();
  });
  await page.goto('/');
  await expect.poll(async () => page.evaluate(() => window.CORA_DATA?.produtos?.map(r => r.ID) || []))
    .toEqual(['E']);
});


test('avaliação só mostra sucesso após persistência confirmada', async ({ page }) => {
  await page.route('**/cora-familia-api.diego-freitas-2cd.workers.dev/**', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false })
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await page.locator("#nav button[data-tab='avaliar']").click();
  await page.locator('.star[data-v="5"]').click();
  await page.locator('#sendFeedback').click();
  await expect(page.locator('#feedbackStatus')).toContainText('Não foi possível enviar agora.');
});

test('avaliação confirma sucesso quando backend retorna ok true', async ({ page }) => {
  await page.route('**/cora-familia-api.diego-freitas-2cd.workers.dev/**', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await page.locator("#nav button[data-tab='avaliar']").click();
  await page.locator('.star[data-v="5"]').click();
  await page.locator('#sendFeedback').click();
  await expect(page.locator('#feedbackStatus')).toContainText('Avaliação enviada');
});
