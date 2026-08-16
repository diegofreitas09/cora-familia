const C=window.CORA_CONFIG,D=window.CORA_DATA;
const brl=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const $=id=>document.getElementById(id);
const setText=(id,value)=>{const el=$(id);if(el)el.textContent=value};

const pages=[...document.querySelectorAll('.page')],tabs=[...document.querySelectorAll('#nav button')];
function go(id){pages.forEach(p=>p.classList.toggle('active',p.id===id));tabs.forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo(0,0)}
tabs.forEach(b=>b.onclick=()=>go(b.dataset.tab));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));

const serieSel=$('serieSel'),planoSel=$('planoSel'),condSel=$('condSel'),anuidadeCheck=$('anuidadeCheck'),primeiraCheck=$('primeiraCheck'),materialCheck=$('materialCheck'),uniformList=$('uniformList');
D.series.forEach(s=>serieSel.add(new Option(s.nome,s.id)));
let qties={};

function serie(){return D.series.find(s=>s.id===serieSel.value)||D.series[0]}
function mensalidadeData(){
  const s=serie(),m=D.mensalidades[s.segmento],pl=planoSel.value,co=condSel.value,p=m['plano'+pl];
  return {s,m,p,co,monthly:Number(p[co])||0,annual:Number(co==='ate'?m.anuidadeAte:m.anuidadeApos)||0,primeira:Number(m.primeira)||0};
}
function uniforms(){const s=serie();return (D.fardamento[s.segmento]||[]).filter(x=>!x.restrito||x.restrito.includes(s.id))}
function selectedUniforms(){return uniforms().filter(u=>(Number(qties[u.nome])||0)>0)}

function renderUniforms(){
  const rows=uniforms();
  if(!uniformList)return;
  uniformList.innerHTML=rows.map((u,i)=>`<div class='uniform'><div><b>${u.nome}</b><br><small>${brl(u.valor)}</small></div><div class='qty'><button type='button' data-i='${i}' data-d='-1'>−</button><span>${Number(qties[u.nome])||0}</span><button type='button' data-i='${i}' data-d='1'>+</button></div></div>`).join('');
  uniformList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const u=rows[Number(b.dataset.i)],d=Number(b.dataset.d);
    qties[u.nome]=Math.max(0,(Number(qties[u.nome])||0)+d);
    renderUniforms();
    calc();
  });
}

function quoteValues(){
  const {s,m,p,co,monthly,annual,primeira}=mensalidadeData();
  const mat=materialCheck&&materialCheck.checked?Number(s.material)||0:0;
  let mens=0;
  if(anuidadeCheck&&anuidadeCheck.checked) mens=annual;
  else if(primeiraCheck&&primeiraCheck.checked) mens=primeira;
  const f=uniforms().reduce((sum,u)=>sum+(Number(u.valor)||0)*(Number(qties[u.nome])||0),0);
  return {s,m,p,co,monthly,annual,primeira,mat,f,mens,total:mens+mat+f};
}

function cartCount(){
  let n=0;
  if(anuidadeCheck&&anuidadeCheck.checked)n++;
  if(primeiraCheck&&primeiraCheck.checked)n++;
  if(materialCheck&&materialCheck.checked)n++;
  Object.values(qties).forEach(q=>n+=Number(q)||0);
  return n;
}
function updateCart(){
  const n=cartCount();
  setText('cartBadge',String(n));
  setText('cartNavCount',String(n));
  setText('cartCountText',`${n} ${n===1?'item selecionado':'itens selecionados'}`);
}

function renderSelectedItems(v){
  const box=$('selectedItemsList');if(!box)return;
  const items=[];
  if(anuidadeCheck.checked)items.push(`Anuidade 2026 — ${brl(v.annual)}`);
  if(primeiraCheck.checked)items.push(anuidadeCheck.checked?`1ª parcela — ${brl(v.primeira)} (já incluída na anuidade)`:`1ª parcela — ${brl(v.primeira)}`);
  if(materialCheck.checked)items.push(`Livros / material didático — ${brl(v.mat)}`);
  selectedUniforms().forEach(u=>{const q=Number(qties[u.nome])||0;items.push(`${u.nome} × ${q} — ${brl((Number(u.valor)||0)*q)}`)});
  box.innerHTML=items.length?items.map(x=>`<div class='selected-row'>✓ ${x}</div>`).join(''):`<div class='empty-cart'>Nenhum item selecionado.</div>`;
}

function calc(){
  try{
    const v=quoteValues();
    setText('primeiraVal',brl(v.primeira));
    setText('mensalVal',brl(v.monthly));
    setText('mensalDesc',`${v.p.parcelas} parcelas de ${brl(v.monthly)}`);
    setText('anuidadeVal',brl(v.annual));
    setText('anuidadeChoiceVal',brl(v.annual));
    setText('primeiraChoiceVal',brl(v.primeira));
    setText('materialChoiceVal',brl(v.s.material));
    setText('sumMens',brl(v.mens));
    setText('sumMat',brl(v.mat));
    setText('sumFarda',brl(v.f));
    setText('sumTotal',brl(v.total));
    renderSelectedItems(v);
    updateCart();
  }catch(err){console.error('Erro no cálculo do orçamento:',err)}
}

[serieSel,planoSel,condSel,anuidadeCheck,primeiraCheck,materialCheck].filter(Boolean).forEach(e=>e.addEventListener('change',()=>{
  if(e===serieSel)qties={};
  renderUniforms();
  calc();
}));
renderUniforms();
calc();

function quoteText(){
  const v=quoteValues();
  const lines=[`Cora Família — Orçamento informativo 2026`,`Série/segmento: ${v.s.nome}`,`Plano: Plano ${planoSel.value}`,`Condição: ${condSel.options[condSel.selectedIndex].text}`,`Parcelas seguintes: ${v.p.parcelas} x ${brl(v.monthly)}`,''];
  if(anuidadeCheck.checked)lines.push(`Anuidade: ${brl(v.annual)}`);
  if(primeiraCheck.checked)lines.push(anuidadeCheck.checked?`1ª parcela: ${brl(v.primeira)} (já incluída na anuidade)`:`1ª parcela: ${brl(v.primeira)}`);
  if(materialCheck.checked)lines.push(`Livros / material didático: ${brl(v.mat)}`);
  selectedUniforms().forEach(u=>{const q=Number(qties[u.nome])||0;lines.push(`${u.nome} — ${q} un. x ${brl(u.valor)} = ${brl((Number(u.valor)||0)*q)}`)});
  lines.push('',`Itens selecionados: ${cartCount()}`,`Total estimado: ${brl(v.total)}`,'','*Simulação informativa. Confirme condições com a escola.');
  return lines.join('\n');
}

if($('shareQuote'))$('shareQuote').onclick=async()=>{
  const txt=quoteText();
  if(navigator.share){try{await navigator.share({title:'Cora Família - Orçamento',text:txt})}catch(e){}}
  else if(navigator.clipboard){navigator.clipboard.writeText(txt);alert('Orçamento copiado.');}
};

function pdfHtml(){
  const v=quoteValues(),logo=new URL('logo-escola.png',location.href).href,rows=[];
  if(anuidadeCheck.checked)rows.push(['Anuidade 2026','1',brl(v.annual),brl(v.annual)]);
  if(primeiraCheck.checked)rows.push(['1ª parcela','1',brl(v.primeira),anuidadeCheck.checked?'Incluída na anuidade':brl(v.primeira)]);
  if(materialCheck.checked)rows.push(['Livros / material didático','1',brl(v.mat),brl(v.mat)]);
  selectedUniforms().forEach(u=>{const q=Number(qties[u.nome])||0;rows.push([u.nome,String(q),brl(u.valor),brl((Number(u.valor)||0)*q)])});
  const data=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Fortaleza'}).format(new Date());
  return `<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Orçamento Cora Família - ${v.s.nome}</title><style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#102841;margin:0}.head{display:flex;align-items:center;gap:14px;border-bottom:4px solid #0f5ea8;padding-bottom:14px}.head img{width:78px;height:78px;object-fit:contain}.head h1{margin:0;color:#082e59}.meta{background:#eef6fc;padding:14px;border-radius:10px;margin:18px 0;line-height:1.7}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.mini{border:1px solid #dbe6ef;border-radius:8px;padding:10px}.mini small{color:#65788b}.mini b{display:block;margin-top:4px;color:#082e59}h2{color:#0f5ea8;margin-top:24px}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}th{background:#082e59;color:#fff;text-align:left;padding:9px}td{padding:9px;border-bottom:1px solid #dbe6ef}td:nth-child(2),td:nth-child(3),td:nth-child(4){text-align:right}.total{margin-top:18px;background:#e9f8f0;border-left:5px solid #1d9b69;padding:16px;font-size:22px;font-weight:900}.note{font-size:11px;color:#65788b;margin-top:22px}.footer{margin-top:30px;border-top:1px solid #dbe6ef;padding-top:10px;text-align:center;font-size:11px;color:#65788b}@media(max-width:600px){.cards{grid-template-columns:1fr}}@media print{button{display:none}}</style></head><body><div class='head'><img src='${logo}'><div><small>COLÉGIO CORA CORALINA</small><h1>Cora Família</h1><div>Orçamento informativo 2026</div></div></div><div class='meta'><b>Série/segmento:</b> ${v.s.nome}<br><b>Plano:</b> Plano ${planoSel.value} — ${v.p.parcelas} parcelas seguintes<br><b>Condição:</b> ${condSel.options[condSel.selectedIndex].text}<br><b>Gerado em:</b> ${data}<br><b>Itens selecionados:</b> ${cartCount()}</div><div class='cards'><div class='mini'><small>1ª parcela 2026</small><b>${brl(v.primeira)}</b></div><div class='mini'><small>Parcela seguinte</small><b>${brl(v.monthly)}</b></div><div class='mini'><small>Anuidade 2026</small><b>${brl(v.annual)}</b></div></div><h2>Itens solicitados</h2><table><thead><tr><th>Item</th><th>Qtd.</th><th>Valor unitário</th><th>Subtotal</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join(''):`<tr><td colspan='4'>Nenhum item selecionado.</td></tr>`}</tbody></table><div class='total'>Total estimado: ${brl(v.total)}</div><div class='note'>A 1ª parcela não é somada novamente quando a anuidade está selecionada, pois já integra o valor anual. Simulação informativa baseada nos valores de referência de 2026. Valores, disponibilidade e condições devem ser confirmados com o Colégio Cora Coralina.</div><div class='footer'>Cora Família • Colégio Cora Coralina</div><script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script></body></html>`;
}

if($('downloadQuotePdf'))$('downloadQuotePdf').onclick=()=>{
  calc();
  const w=window.open('','_blank');
  if(!w){alert('Permita pop-ups para gerar o PDF.');return}
  w.document.open();w.document.write(pdfHtml());w.document.close();
};

if($('valueCards'))$('valueCards').innerHTML=D.series.map(s=>{const m=D.mensalidades[s.segmento];return `<div class='card' style='margin:10px 0'><h3>${s.nome}</h3><div class='grid'><div><small>Material didático</small><div class='big'>${brl(s.material)}</div></div><div><small>Plano A — até vencimento</small><div class='big'>${brl(m.planoA.ate)}</div><p>1ª ${brl(m.primeira)} + 12 parcelas</p></div><div><small>Plano B — até vencimento</small><div class='big'>${brl(m.planoB.ate)}</div><p>1ª ${brl(m.primeira)} + 11 parcelas</p></div></div></div>`}).join('');

if($('phoneLink')){$('phoneLink').href='tel:+55'+C.escola.telefone;setText('phoneText',C.escola.telefoneExibicao)}
if($('instaLink')){$('instaLink').href='https://instagram.com/'+C.escola.instagram;setText('instaText','@'+C.escola.instagram)}
setText('addressText',C.escola.endereco);
if($('waLink')){if(C.escola.whatsapp){$('waLink').href='https://wa.me/'+C.escola.whatsapp;$('waLink').target='_blank';setText('waText',C.escola.whatsappExibicao)}else{setText('waText','Número a confirmar');$('waLink').onclick=()=>alert('Cadastre o número oficial do WhatsApp em config.js.')}}

let rating=0;
document.querySelectorAll('.star').forEach(s=>s.onclick=()=>{rating=+s.dataset.v;document.querySelectorAll('.star').forEach(x=>x.classList.toggle('on',+x.dataset.v<=rating))});
function localSave(record){const a=JSON.parse(localStorage.getItem('coraFeedbacks')||'[]');a.push(record);localStorage.setItem('coraFeedbacks',JSON.stringify(a))}
if($('sendFeedback'))$('sendFeedback').onclick=async()=>{
  if(!rating){$('feedbackStatus').style.color='#c64343';$('feedbackStatus').textContent='Escolha de 1 a 5 estrelas.';return}
  if(!$('fbFuncionario').value.trim()){$('feedbackStatus').style.color='#c64343';$('feedbackStatus').textContent='Informe o nome do funcionário.';return}
  const record={data:new Date().toISOString(),responsavel:$('fbNome').value.trim(),funcionario:$('fbFuncionario').value.trim(),canal:$('fbCanal').value,estrelas:rating,mensagem:$('fbMsg').value.trim()};
  let ok=false;if(C.feedbackEndpoint){try{const r=await fetch(C.feedbackEndpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(record)});ok=r.ok}catch(e){}}
  localSave(record);$('feedbackStatus').style.color='#1d9b69';$('feedbackStatus').textContent=ok?'Avaliação enviada. Obrigado!':'Avaliação registrada neste aparelho. A integração central será ativada na próxima etapa.';$('fbMsg').value='';rating=0;document.querySelectorAll('.star').forEach(x=>x.classList.remove('on'));
};

let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if($('installBtn'))$('installBtn').hidden=false});
if($('installBtn'))$('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$('installBtn').hidden=true}else if(/iPhone|iPad|iPod/.test(navigator.userAgent)){alert('No Safari: Compartilhar → Adicionar à Tela de Início.')}};
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js');