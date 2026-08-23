(()=>{
  const q=s=>document.querySelector(s);
  function buildHome(){
    const home=q('#inicio');
    if(!home||home.dataset.landingV46==='1')return;
    home.dataset.landingV46='1';
    home.innerHTML=`
      <section class="lp-hero" aria-labelledby="lp-title">
        <div class="lp-hero-bg" aria-hidden="true"></div>
        <div class="lp-hero-overlay" aria-hidden="true"></div>
        <div class="lp-hero-content">
          <div class="lp-kicker"><span></span>CORA FAMÍLIA • MATRÍCULAS 2027</div>
          <h2 id="lp-title">Sua família mais perto da escola.</h2>
          <p>Mensalidades, material didático, fardamento, orçamento e atendimento reunidos em uma experiência simples, rápida e segura.</p>
          <div class="lp-actions">
            <button class="lp-primary" type="button" data-go="orcamento">Montar meu orçamento <b>→</b></button>
            <button class="lp-secondary" type="button" data-go="valores">Ver valores de 2027</button>
          </div>
          <div class="lp-trust"><span>✓ Valores oficiais 2027</span><span>✓ PDF do orçamento</span><span>✓ Atendimento da Recepção</span></div>
        </div>
      </section>
      <section class="lp-section">
        <div class="lp-section-head"><div><small>ACESSO RÁPIDO</small><h3>Resolva tudo em poucos toques</h3></div><p>Escolha o que você precisa agora.</p></div>
        <div class="lp-shortcuts">
          <article class="lp-feature lp-feature-main" data-go="orcamento" role="button" tabindex="0">
            <div class="lp-icon">🧮</div><div><span>ORÇAMENTO 2027</span><h4>Monte uma simulação personalizada</h4><p>Selecione turma, plano, material e fardamento e receba o total na hora.</p></div><b class="lp-arrow">→</b>
          </article>
          <article class="lp-feature" data-go="valores" role="button" tabindex="0">
            <div class="lp-icon">💳</div><div><span>MENSALIDADES</span><h4>Consulte os valores oficiais</h4><p>Planos, parcelas e anuidades sincronizados com o Cora Gestão.</p></div><b class="lp-arrow">→</b>
          </article>
          <article class="lp-feature" data-go="contato" role="button" tabindex="0">
            <div class="lp-icon">💬</div><div><span>ATENDIMENTO</span><h4>Fale com a escola</h4><p>Recepção, telefone, Instagram, endereço e canais oficiais em um só lugar.</p></div><b class="lp-arrow">→</b>
          </article>
          <article class="lp-feature" data-go="historia" role="button" tabindex="0">
            <div class="lp-icon">🏫</div><div><span>NOSSA HISTÓRIA</span><h4>Mais de quatro décadas educando</h4><p>Conheça a trajetória e os valores que fazem parte do Colégio Cora Coralina.</p></div><b class="lp-arrow">→</b>
          </article>
        </div>
      </section>
      <section class="lp-confidence">
        <div><strong>2027</strong><span>Valores oficiais atualizados</span></div>
        <div><strong>1 lugar</strong><span>Informações essenciais da família</span></div>
        <div><strong>Digital</strong><span>Menos papel, mais praticidade</span></div>
      </section>`;
    home.querySelectorAll('[data-go]').forEach(el=>{
      const open=()=>{const tab=q(`#nav button[data-tab="${el.dataset.go}"]`);if(tab)tab.click()};
      el.addEventListener('click',open);
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
    });
  }
  function polish(){
    document.documentElement.classList.add('landing-v46');
    const logo=document.querySelector('header img');if(logo){logo.loading='eager';logo.decoding='async'}
    buildHome();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',polish,{once:true});else polish();
})();
