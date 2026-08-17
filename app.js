const money=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const safe=n=>Number.isFinite(Number(n))?Number(n):0;
const q=id=>document.getElementById(id);
const state={feedbackStars:0,uniformQty:{}};

function go(tab){
  document.querySelectorAll('.page').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
  q(tab)?.classList.add('active');
  document.querySelector(`#nav button[data-tab="${tab}"]`)?.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

function dataRow(){
  return CORA_DATA.series.find(s=>s.id===q('serieSel')?.value)||CORA_DATA.series[0];
}
function mensalidadeRow(){
  const s=dataRow();
  return CORA_DATA.mensalidades[s.segmento];
}
function fillSeries(){
  if(!q('serieSel')) return;
  q('serieSel').innerHTML=CORA_DATA.series.map(s=>`<option value="${s.id}">${s.nome}</option>`).join('');
}
function uniformRowsForSerie(){
  const s=dataRow();
  const rows=(CORA_DATA.fardamento[s.segmento]||[]).filter(u=>!u.restrito||u.restrito.includes(s.id));
  rows.forEach(u=>{if(state.uniformQty[u.nome]===undefined)state.uniformQty[u.nome]=0;});
  return rows;
}
function calcBudget(){
  const s=dataRow();
  const m=mensalidadeRow();
  const plano=q('planoSel')?.value||'A';
  const cond=q('condSel')?.value||'ate';
  const planoObj=plano==='A'?m.planoA:m.planoB;
  const mensal=cond==='ate'?safe(planoObj.ate):safe(planoObj.apos);
  const primeira=safe(m.primeira);
  const parcelas=safe(planoObj.parcelas);
  const anuidade=cond==='ate'?safe(m.anuidadeAte):safe(m.anuidadeApos);
  const includeAnnual=!!q('anuidadeCheck')?.checked;
  const includeFirst=!!q('primeiraCheck')?.checked;
  const includeMat=!!q('materialCheck')?.checked;
  const material=safe(s.material);
  const uniformes=[];
  let uniformTotal=0,uniformCount=0;
  uniformRowsForSerie().forEach(u=>{
    const qt=safe(state.uniformQty[u.nome]);
    if(qt>0){
      const sub=qt*safe(u.valor);
      uniformes.push({item:u.nome,qt,unit:safe(u.valor),sub});
      uniformTotal+=sub;
      uniformCount+=qt;
    }
  });
  const mensalTotal=includeAnnual?anuidade:includeFirst?primeira:0;
  const matTotal=includeMat?material:0;
  const total=mensalTotal+matTotal+uniformTotal;
  const count=(includeAnnual?1:0)+(includeFirst&&!includeAnnual?1:0)+(includeMat?1:0)+uniformCount;
  return {s,m,plano,cond,mensal,primeira,parcelas,anuidade,includeAnnual,includeFirst,includeMat,material,uniformes,uniformTotal,uniformCount,mensalTotal,matTotal,total,count};
}
function updateCart(c){
  if(q('cartBadge')) q('cartBadge').textContent=c.count;
  if(q('cartNavCount')) q('cartNavCount').textContent=c.count;
  if(q('cartCountText')) q('cartCountText').textContent=`${c.count} ${c.count===1?'item selecionado':'itens selecionados'}`;
}
function renderUniforms(){
  const wrap=q('uniformList'); if(!wrap) return;
  const rows=uniformRowsForSerie();
  wrap.innerHTML=rows.map(u=>`<div class="uniform-item"><div><b>${u.nome}</b><small>${money(u.valor)}</small></div><div class="qty"><button type="button" class="qtyBtn" data-item="${encodeURIComponent(u.nome)}" data-delta="-1">−</button><b>${safe(state.uniformQty[u.nome])}</b><button type="button" class="qtyBtn" data-item="${encodeURIComponent(u.nome)}" data-delta="1">+</button></div></div>`).join('');
  document.querySelectorAll('.qtyBtn').forEach(btn=>btn.onclick=()=>{
    const item=decodeURIComponent(btn.dataset.item);
    state.uniformQty[item]=Math.max(0,safe(state.uniformQty[item])+safe(btn.dataset.delta));
    renderBudget();
  });
}
function renderBudget(){
  const c=calcBudget();
  if(q('primeiraVal')) q('primeiraVal').textContent=money(c.primeira);
  if(q('mensalVal')) q('mensalVal').textContent=money(c.mensal);
  if(q('anuidadeVal')) q('anuidadeVal').textContent=money(c.anuidade);
  if(q('mensalDesc')) q('mensalDesc').textContent=`${c.parcelas} parcelas seguintes`;
  if(q('anuidadeChoiceVal')) q('anuidadeChoiceVal').textContent=money(c.anuidade);
  if(q('primeiraChoiceVal')) q('primeiraChoiceVal').textContent=money(c.primeira);
  if(q('materialChoiceVal')) q('materialChoiceVal').textContent=money(c.material);
  renderUniforms();
  const lines=[];
  if(c.includeAnnual) lines.push(`Anuidade — ${money(c.anuidade)}`);
  if(c.includeFirst&&!c.includeAnnual) lines.push(`1ª parcela — ${money(c.primeira)}`);
  if(c.includeMat) lines.push(`Livros / material didático — ${money(c.material)}`);
  c.uniformes.forEach(u=>lines.push(`${u.item} × ${u.qt} — ${money(u.sub)}`));
  if(q('selectedItemsList')) q('selectedItemsList').innerHTML=lines.length?lines.map(x=>`<div class="selected-item">${x}</div>`).join(''):'<small>Nenhum item selecionado.</small>';
  if(q('sumMens')) q('sumMens').textContent=money(c.mensalTotal);
  if(q('sumMat')) q('sumMat').textContent=money(c.matTotal);
  if(q('sumFarda')) q('sumFarda').textContent=money(c.uniformTotal);
  if(q('sumTotal')) q('sumTotal').textContent=money(c.total);
  updateCart(c);
}
function renderValues(){
  const wrap=q('valueCards'); if(!wrap) return;
  wrap.innerHTML=CORA_DATA.series.map(s=>{
    const m=CORA_DATA.mensalidades[s.segmento];
    return `<div class="card value-card"><h3>${s.nome}</h3><div><span>Material didático</span><b>${money(s.material)}</b></div><div><span>1ª parcela</span><b>${money(m.primeira)}</b></div><div><span>Plano A — até o vencimento</span><b>${money(m.planoA.ate)}</b></div><div><span>Plano A — após o vencimento</span><b>${money(m.planoA.apos)}</b></div><div><span>Plano B — até o vencimento</span><b>${money(m.planoB.ate)}</b></div><div><span>Plano B — após o vencimento</span><b>${money(m.planoB.apos)}</b></div></div>`;
  }).join('');
}
function enhanceContacts(){
  const e=CORA_CONFIG.escola||{};
  if(q('phoneText')) q('phoneText').textContent=e.telefoneExibicao||e.telefone||'';
  if(q('phoneLink')) q('phoneLink').href='tel:'+String(e.telefone||'').replace(/\D/g,'');
  if(q('instaText')) q('instaText').textContent='@'+String(e.instagram||'').replace(/^@/,'');
  if(q('instaLink')) q('instaLink').href='https://www.instagram.com/'+String(e.instagram||'').replace(/^@/,'')+'/';
  if(q('waText')) q('waText').textContent=e.whatsappExibicao||'Fale conosco pelo WhatsApp';
  if(q('waLink')){q('waLink').href='https://wa.me/'+String(e.whatsapp||'');q('waLink').target='_blank';}
  if(q('addressText')) q('addressText').textContent=e.endereco||'';
  const insta=q('instaLink')?.querySelector('.ico');
  if(insta){insta.innerHTML=`<svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true"><defs><linearGradient id="igG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffd600"/><stop offset=".32" stop-color="#ff7a00"/><stop offset=".58" stop-color="#ff0169"/><stop offset=".82" stop-color="#d300c5"/><stop offset="1" stop-color="#7638fa"/></linearGradient></defs><rect x="3" y="3" width="42" height="42" rx="12" fill="url(#igG)"/><rect x="13" y="13" width="22" height="22" rx="7" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="5.5" fill="none" stroke="#fff" stroke-width="3"/><circle cx="32.5" cy="15.8" r="2" fill="#fff"/></svg>`;insta.style.background='transparent';}
  const wa=q('waLink')?.querySelector('.ico');
  if(wa){wa.innerHTML=`<svg viewBox="0 0 32 32" width="46" height="46" aria-hidden="true"><path fill="#25D366" d="M16 3C8.82 3 3 8.73 3 15.8c0 2.5.73 4.93 2.1 7L3.5 29l6.44-1.68A13.1 13.1 0 0 0 16 28.6c7.18 0 13-5.73 13-12.8S23.18 3 16 3z"/><path fill="#fff" d="M23.03 19.16c-.38-.19-2.22-1.08-2.57-1.2-.34-.13-.6-.19-.85.19-.26.38-.98 1.2-1.2 1.44-.22.25-.44.28-.82.1-.38-.19-1.6-.58-3.05-1.86-1.13-.99-1.9-2.22-2.12-2.6-.22-.38-.02-.58.16-.77.16-.16.38-.41.57-.6.19-.19.25-.32.38-.54.13-.22.06-.41-.03-.6-.09-.19-.85-2.02-1.16-2.77-.31-.74-.63-.64-.85-.65h-.72c-.25 0-.66.09-1 .44-.35.35-1.32 1.28-1.32 3.11 0 1.83 1.35 3.6 1.54 3.85.19.25 2.63 4.2 6.5 5.72.92.39 1.64.62 2.2.79.92.29 1.76.25 2.42.15.74-.11 2.22-.91 2.53-1.79.31-.88.31-1.63.22-1.79-.1-.16-.35-.25-.72-.44z"/></svg>`;wa.style.background='transparent';}
}
function setupFeedback(){
  document.querySelectorAll('.star').forEach(st=>st.onclick=()=>{
    state.feedbackStars=safe(st.dataset.v);
    document.querySelectorAll('.star').forEach(x=>x.classList.toggle('on',safe(x.dataset.v)<=state.feedbackStars));
  });
  if(q('sendFeedback')) q('sendFeedback').onclick=async()=>{
    const status=q('feedbackStatus');
    if(!state.feedbackStars){status.textContent='Escolha de 1 a 5 estrelas.';return;}
    const payload={nome:q('fbNome')?.value||'',funcionario:q('fbFuncionario')?.value||'',canal:q('fbCanal')?.value||'',estrelas:state.feedbackStars,mensagem:q('fbMsg')?.value||'',origem:'Cora Família'};
    try{
      status.textContent='Enviando...';
      await fetch(CORA_CONFIG.feedbackEndpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      status.textContent='✅ Avaliação enviada. Obrigado!';
      if(q('fbMsg')) q('fbMsg').value='';
    }catch(e){status.textContent='Não foi possível enviar agora.';}
  };
}
function shareBudget(){
  const c=calcBudget();
  const itens=[];
  if(c.includeAnnual) itens.push(`Anuidade: ${money(c.anuidade)}`);
  if(c.includeFirst&&!c.includeAnnual) itens.push(`1ª parcela: ${money(c.primeira)}`);
  if(c.includeMat) itens.push(`Material didático: ${money(c.material)}`);
  c.uniformes.forEach(u=>itens.push(`${u.item} x${u.qt}: ${money(u.sub)}`));
  const txt=`Cora Família — orçamento 2026\n${c.s.nome}\n${itens.join('\n')}\nTotal estimado: ${money(c.total)}`;
  if(navigator.share) navigator.share({title:'Cora Família',text:txt}).catch(()=>{});
  else navigator.clipboard?.writeText(txt).then(()=>alert('Resumo copiado.'));
}
function downloadPdf(){
  const c=calcBudget();
  const rows=[];
  if(c.includeAnnual) rows.push(['Anuidade',1,c.anuidade,c.anuidade]);
  if(c.includeFirst&&!c.includeAnnual) rows.push(['1ª parcela',1,c.primeira,c.primeira]);
  if(c.includeMat) rows.push(['Livros / material didático',1,c.material,c.material]);
  c.uniformes.forEach(u=>rows.push([u.item,u.qt,u.unit,u.sub]));
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Orçamento Cora Família</title><style>body{font-family:Arial;margin:35px;color:#0b2e56}header{display:flex;align-items:center;border-bottom:3px solid #0f5ea8;padding-bottom:12px}header img{width:70px;margin-right:15px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}th{background:#0b3564;color:#fff}.total{font-size:22px;font-weight:800;text-align:right;margin-top:20px}.note{margin-top:25px;font-size:12px;color:#555}</style></head><body><header><img src="logo-escola.png"><div><b>COLÉGIO CORA CORALINA</b><h2>Cora Família — Orçamento 2026</h2></div></header><p><b>Série/segmento:</b> ${c.s.nome}<br><b>Plano:</b> ${c.plano==='A'?'Plano A':'Plano B'}<br><b>Condição:</b> ${c.cond==='ate'?'Até o vencimento':'Após o vencimento'}<br><b>Itens selecionados:</b> ${c.count}<br><b>Data:</b> ${new Date().toLocaleString('pt-BR')}</p><table><thead><tr><th>Item</th><th>Qtde</th><th>Unitário</th><th>Subtotal</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${money(r[2])}</td><td>${money(r[3])}</td></tr>`).join('')}</tbody></table><div class="total">Total estimado: ${money(c.total)}</div><div class="note">Simulação informativa com valores de referência de 2026. Consulte a escola para confirmação das condições vigentes.</div><script>window.onload=()=>window.print()<\/script></body></html>`;
  const w=window.open('','_blank');
  if(!w){alert('Permita pop-ups para gerar o PDF.');return;}
  w.document.open();w.document.write(html);w.document.close();
}
function resetBudgetState(){
  Object.keys(state.uniformQty).forEach(k=>state.uniformQty[k]=0);
  if(q('anuidadeCheck')) q('anuidadeCheck').checked=false;
  if(q('primeiraCheck')) q('primeiraCheck').checked=false;
  if(q('materialCheck')) q('materialCheck').checked=false;
  if(q('serieSel')) q('serieSel').selectedIndex=0;
  if(q('planoSel')) q('planoSel').value='A';
  if(q('condSel')) q('condSel').value='ate';
  renderBudget();
}
function init(){
  fillSeries();
  resetBudgetState();
  renderValues();
  enhanceContacts();
  setupFeedback();
  ['serieSel','planoSel','condSel','anuidadeCheck','primeiraCheck','materialCheck'].forEach(id=>q(id)?.addEventListener('change',()=>{
    if(id==='serieSel'){
      Object.keys(state.uniformQty).forEach(k=>state.uniformQty[k]=0);
    }
    renderBudget();
  }));
  if(q('shareQuote')) q('shareQuote').onclick=shareBudget;
  if(q('downloadQuotePdf')) q('downloadQuotePdf').onclick=downloadPdf;
  renderBudget();
}
init();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
let deferredPrompt;
const installBtn=q('installBtn');
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  if(installBtn) installBtn.hidden=false;
});
if(installBtn) installBtn.onclick=async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt=null;
  installBtn.hidden=true;
};
window.addEventListener('appinstalled',()=>{if(installBtn) installBtn.hidden=true;});