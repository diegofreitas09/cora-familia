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
}
function setupFeedback(){
  document.querySelectorAll('.star').forEach(st=>st.onclick=()=>{
    state.feedbackStars=safe(st.dataset.v);
    document.querySelectorAll('.star').forEach(x=>x.classList.toggle('on',safe(x.dataset.v)<=state.feedbackStars));
  });
  if(q('sendFeedback')) q('sendFeedback').onclick=async()=>{
    const status=q('feedbackStatus');
    if(!state.feedbackStars){status.textContent='Escolha de 1 a 5 estrelas.';return;}
    const nomeResponsavel=q('fbNome')?.value||'';
    const payload={
      responsavel:nomeResponsavel,
      nome:nomeResponsavel,
      funcionario:q('fbFuncionario')?.value||'',
      canal:q('fbCanal')?.value||'',
      estrelas:state.feedbackStars,
      mensagem:q('fbMsg')?.value||'',
      origem:'Cora Família'
    };
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
  const txt=`Cora Família — orçamento 2027\n${c.s.nome}\n${itens.join('\n')}\nTotal estimado: ${money(c.total)}`;
  if(navigator.share) navigator.share({title:'Cora Família',text:txt}).catch(()=>{});
  else navigator.clipboard?.writeText(txt).then(()=>alert('Resumo copiado.'));
}
async function downloadPdf(){
  const btn=q('downloadQuotePdf');
  const original=btn?btn.innerHTML:'';
  try{
    if(btn){btn.disabled=true;btn.textContent='Carregando gerador de PDF...';}
    let script=document.querySelector('script[data-cora-pdf-download]');
    if(!script){
      await new Promise((resolve,reject)=>{
        script=document.createElement('script');
        script.src='pdf-download.js?v=2';
        script.async=true;
        script.dataset.coraPdfDownload='1';
        script.onload=resolve;
        script.onerror=()=>reject(new Error('Falha ao carregar PDF'));
        document.body.appendChild(script);
      });
    }else{
      await new Promise(resolve=>setTimeout(resolve,80));
    }
    if(btn){
      btn.disabled=false;
      btn.innerHTML=original;
      setTimeout(()=>btn.click(),50);
    }
  }catch(e){
    console.error(e);
    if(btn){btn.disabled=false;btn.innerHTML=original;}
    alert('Não foi possível carregar o gerador de PDF. Tente novamente.');
  }
}
function init(){
  fillSeries();
  if(q('anuidadeCheck')) q('anuidadeCheck').checked=false;
  if(q('primeiraCheck')) q('primeiraCheck').checked=false;
  if(q('materialCheck')) q('materialCheck').checked=false;
  renderValues();enhanceContacts();setupFeedback();
  ['serieSel','planoSel','condSel','anuidadeCheck','primeiraCheck','materialCheck'].forEach(id=>q(id)?.addEventListener('change',renderBudget));
  if(q('shareQuote')) q('shareQuote').onclick=shareBudget;
  if(q('downloadQuotePdf')) q('downloadQuotePdf').onclick=downloadPdf;
  renderBudget();
}
init();
