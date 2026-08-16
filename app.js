(()=>{
'use strict';
const C=window.CORA_CONFIG||{},D=window.CORA_DATA||{};
const $=id=>document.getElementById(id);
const brl=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const setText=(id,v)=>{const e=$(id);if(e)e.textContent=v};

function start(){
  const pages=[...document.querySelectorAll('.page')];
  const tabs=[...document.querySelectorAll('#nav button[data-tab]')];
  const go=id=>{pages.forEach(p=>p.classList.toggle('active',p.id===id));tabs.forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'})};
  tabs.forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

  const serieSel=$('serieSel'),planoSel=$('planoSel'),condSel=$('condSel');
  const anuidadeCheck=$('anuidadeCheck'),primeiraCheck=$('primeiraCheck'),materialCheck=$('materialCheck');
  const uniformList=$('uniformList');
  let qties={};

  if(!serieSel||!planoSel||!condSel){console.error('Cora Família: seletores do orçamento não encontrados.');return}
  serieSel.innerHTML='';
  (D.series||[]).forEach(s=>serieSel.add(new Option(s.nome,s.id)));

  const serie=()=> (D.series||[]).find(s=>s.id===serieSel.value)||(D.series||[])[0];
  const mensalidadeData=()=>{
    const s=serie();
    if(!s)throw new Error('Nenhuma série cadastrada.');
    const m=(D.mensalidades||{})[s.segmento];
    if(!m)throw new Error('Mensalidade não cadastrada para '+s.segmento);
    const plano=String(planoSel.value||'A').toUpperCase();
    const p=m['plano'+plano];
    if(!p)throw new Error('Plano '+plano+' não encontrado.');
    const cond=condSel.value==='apos'?'apos':'ate';
    return {s,m,p,plano,cond,primeira:Number(m.primeira)||0,monthly:Number(p[cond])||0,annual:Number(cond==='ate'?m.anuidadeAte:m.anuidadeApos)||0};
  };
  const uniforms=()=>{
    const s=serie();
    return s?((D.fardamento||{})[s.segmento]||[]).filter(x=>!x.restrito||x.restrito.includes(s.id)):[];
  };
  const qKey=u=>`${serieSel.value}::${u.nome}`;
  const qty=u=>Number(qties[qKey(u)])||0;
  const selectedUniforms=()=>uniforms().filter(u=>qty(u)>0);

  function quoteValues(){
    const x=mensalidadeData();
    const material=materialCheck?.checked?(Number(x.s.material)||0):0;
    const mensal=anuidadeCheck?.checked?x.annual:(primeiraCheck?.checked?x.primeira:0);
    const farda=uniforms().reduce((sum,u)=>sum+(Number(u.valor)||0)*qty(u),0);
    return {...x,material,mensal,farda,total:mensal+material+farda};
  }

  function cartCount(){
    let n=0;
    if(anuidadeCheck?.checked)n++;
    if(primeiraCheck?.checked)n++;
    if(materialCheck?.checked)n++;
    uniforms().forEach(u=>n+=qty(u));
    return n;
  }

  function updateCart(){
    const n=cartCount();
    setText('cartBadge',n);
    setText('cartNavCount',n);
    setText('cartCountText',`${n} ${n===1?'item selecionado':'itens selecionados'}`);
  }

  function renderUniforms(){
    if(!uniformList)return;
    const rows=uniforms();
    uniformList.innerHTML=rows.map((u,i)=>`<div class="uniform"><div><b>${u.nome}</b><br><small>${brl(u.valor)}</small></div><div class="qty"><button type="button" data-i="${i}" data-d="-1">−</button><span>${qty(u)}</span><button type="button" data-i="${i}" data-d="1">+</button></div></div>`).join('');
    uniformList.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      const u=rows[Number(btn.dataset.i)];
      if(!u)return;
      qties[qKey(u)]=Math.max(0,qty(u)+Number(btn.dataset.d||0));
      renderUniforms();
      calc();
    }));
  }

  function renderSelected(v){
    const box=$('selectedItemsList');if(!box)return;
    const rows=[];
    if(anuidadeCheck?.checked)rows.push(`Anuidade 2026 — ${brl(v.annual)}`);
    if(primeiraCheck?.checked)rows.push(anuidadeCheck?.checked?`1ª parcela — ${brl(v.primeira)} (já incluída na anuidade)`:`1ª parcela — ${brl(v.primeira)}`);
    if(materialCheck?.checked)rows.push(`Livros / material didático — ${brl(v.material)}`);
    selectedUniforms().forEach(u=>rows.push(`${u.nome} × ${qty(u)} — ${brl((Number(u.valor)||0)*qty(u))}`));
    box.innerHTML=rows.length?rows.map(r=>`<div class="selected-row">✓ ${r}</div>`).join(''):'<div class="empty-cart">Nenhum item selecionado.</div>';
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
      setText('sumMens',brl(v.mensal));
      setText('sumMat',brl(v.material));
      setText('sumFarda',brl(v.farda));
      setText('sumTotal',brl(v.total));
      renderSelected(v);updateCart();
    }catch(e){
      console.error('Cora Família — erro de cálculo:',e);
      setText('sumMens','Erro');setText('sumMat','Erro');setText('sumFarda','Erro');setText('sumTotal','Erro');
    }
  }

  [serieSel,planoSel,condSel,anuidadeCheck,primeiraCheck,materialCheck].filter(Boolean).forEach(el=>el.addEventListener('change',()=>{
    if(el===serieSel)qties={};
    renderUniforms();calc();
  }));

  function quoteText(){
    const v=quoteValues(),out=[
      'CORA FAMÍLIA — ORÇAMENTO INFORMATIVO 2026',
      `Série/segmento: ${v.s.nome}`,
      `Plano: Plano ${v.plano}`,
      `Condição: ${condSel.options[condSel.selectedIndex].text}`,
      ''
    ];
    if(anuidadeCheck?.checked)out.push(`Anuidade: ${brl(v.annual)}`);
    if(primeiraCheck?.checked)out.push(anuidadeCheck?.checked?`1ª parcela: ${brl(v.primeira)} — incluída na anuidade`:`1ª parcela: ${brl(v.primeira)}`);
    if(materialCheck?.checked)out.push(`Livros/material didático: ${brl(v.material)}`);
    selectedUniforms().forEach(u=>out.push(`${u.nome}: ${qty(u)} × ${brl(u.valor)} = ${brl(qty(u)*Number(u.valor))}`));
    out.push('',`Total estimado: ${brl(v.total)}`,'','Simulação informativa. Confirme condições com a escola.');
    return out.join('\n');
  }

  const share=$('shareQuote');if(share)share.addEventListener('click',async()=>{
    const text=quoteText();
    if(navigator.share){try{await navigator.share({title:'Cora Família — Orçamento',text})}catch(e){}}
    else if(navigator.clipboard){await navigator.clipboard.writeText(text);alert('Orçamento copiado.');}
  });

  function pdfHtml(){
    const v=quoteValues();
    const logo=new URL('logo-escola.png',location.href).href;
    const rows=[];
    if(anuidadeCheck?.checked)rows.push(['Anuidade 2026','1',brl(v.annual),brl(v.annual)]);
    if(primeiraCheck?.checked)rows.push(['1ª parcela','1',brl(v.primeira),anuidadeCheck?.checked?'Incluída na anuidade':brl(v.primeira)]);
    if(materialCheck?.checked)rows.push(['Livros / material didático','1',brl(v.material),brl(v.material)]);
    selectedUniforms().forEach(u=>rows.push([u.nome,String(qty(u)),brl(u.valor),brl(qty(u)*Number(u.valor))]));
    const data=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Fortaleza'}).format(new Date());
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Orçamento Cora Família</title><style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#102841;margin:0}.head{display:flex;align-items:center;gap:14px;border-bottom:4px solid #0f5ea8;padding-bottom:14px}.head img{width:82px;height:82px;object-fit:contain}h1{margin:0;color:#082e59}.meta{background:#eef6fc;padding:14px;border-radius:10px;margin:18px 0;line-height:1.7}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mini{border:1px solid #dbe6ef;border-radius:8px;padding:10px}.mini small{color:#65788b}.mini b{display:block;margin-top:4px;color:#082e59}h2{color:#0f5ea8;margin-top:24px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#082e59;color:white;text-align:left;padding:9px}td{padding:9px;border-bottom:1px solid #dbe6ef}td:nth-child(n+2){text-align:right}.total{margin-top:18px;background:#e9f8f0;border-left:5px solid #1d9b69;padding:16px;font-size:22px;font-weight:900}.note,.footer{font-size:11px;color:#65788b}.note{margin-top:20px}.footer{margin-top:30px;border-top:1px solid #dbe6ef;padding-top:10px;text-align:center}</style></head><body><div class="head"><img src="${logo}"><div><small>COLÉGIO CORA CORALINA</small><h1>Cora Família</h1><div>Orçamento informativo — valores de referência 2026</div></div></div><div class="meta"><b>Série/segmento:</b> ${v.s.nome}<br><b>Plano:</b> Plano ${v.plano} — 1ª + ${v.p.parcelas} parcelas<br><b>Condição:</b> ${condSel.options[condSel.selectedIndex].text}<br><b>Gerado em:</b> ${data}<br><b>Itens selecionados:</b> ${cartCount()}</div><div class="cards"><div class="mini"><small>1ª parcela</small><b>${brl(v.primeira)}</b></div><div class="mini"><small>Parcela seguinte</small><b>${brl(v.monthly)}</b></div><div class="mini"><small>Anuidade</small><b>${brl(v.annual)}</b></div></div><h2>Itens solicitados</h2><table><thead><tr><th>Item</th><th>Qtd.</th><th>Valor unitário</th><th>Subtotal</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join(''):'<tr><td colspan="4">Nenhum item selecionado.</td></tr>'}</tbody></table><div class="total">Total estimado: ${brl(v.total)}</div><div class="note">Quando a anuidade está selecionada, a 1ª parcela é exibida apenas como informação e não é somada novamente. Simulação baseada nos valores de referência de 2026. Confirme valores e condições com o Colégio Cora Coralina.</div><div class="footer">Colégio Cora Coralina • Cora Família</div><script>window.onload=()=>setTimeout(()=>window.print(),500)<\/script></body></html>`;
  }

  const pdf=$('downloadQuotePdf');if(pdf)pdf.addEventListener('click',()=>{
    calc();
    const w=window.open('','_blank');if(!w){alert('Permita pop-ups para gerar o PDF.');return}
    w.document.open();w.document.write(pdfHtml());w.document.close();
  });

  const valueCards=$('valueCards');
  if(valueCards){
    valueCards.innerHTML=(D.series||[]).map(s=>{
      const m=(D.mensalidades||{})[s.segmento];if(!m)return'';
      return `<div class="card" style="margin:10px 0"><h3>${s.nome}</h3><div class="grid"><div><small>Livros / material didático</small><div class="big">${brl(s.material)}</div></div><div><small>Plano A — até o vencimento</small><div class="big">${brl(m.planoA.ate)}</div><p>1ª ${brl(m.primeira)} + ${m.planoA.parcelas} parcelas</p><p><b>Anuidade: ${brl(m.anuidadeAte)}</b></p></div><div><small>Plano B — até o vencimento</small><div class="big">${brl(m.planoB.ate)}</div><p>1ª ${brl(m.primeira)} + ${m.planoB.parcelas} parcelas</p><p><b>Anuidade: ${brl(m.anuidadeAte)}</b></p></div></div></div>`;
    }).join('');
  }

  if($('phoneLink')){$('phoneLink').href='tel:+55'+C.escola.telefone;setText('phoneText',C.escola.telefoneExibicao)}
  if($('instaLink')){$('instaLink').href='https://instagram.com/'+C.escola.instagram;setText('instaText','@'+C.escola.instagram)}
  setText('addressText',C.escola?.endereco||'');
  if($('waLink')){if(C.escola?.whatsapp){$('waLink').href='https://wa.me/'+C.escola.whatsapp;$('waLink').target='_blank';setText('waText',C.escola.whatsappExibicao)}else{setText('waText','Número a confirmar');$('waLink').onclick=()=>alert('WhatsApp oficial ainda não cadastrado.')}}

  let rating=0;
  document.querySelectorAll('.star').forEach(s=>s.addEventListener('click',()=>{rating=Number(s.dataset.v);document.querySelectorAll('.star').forEach(x=>x.classList.toggle('on',Number(x.dataset.v)<=rating))}));
  const localSave=record=>{const a=JSON.parse(localStorage.getItem('coraFeedbacks')||'[]');a.push(record);localStorage.setItem('coraFeedbacks',JSON.stringify(a))};
  const send=$('sendFeedback');if(send)send.addEventListener('click',async()=>{
    if(!rating){setText('feedbackStatus','Escolha de 1 a 5 estrelas.');$('feedbackStatus').style.color='#c64343';return}
    if(!$('fbFuncionario').value.trim()){setText('feedbackStatus','Informe o nome do funcionário.');$('feedbackStatus').style.color='#c64343';return}
    const record={data:new Date().toISOString(),responsavel:$('fbNome').value.trim(),funcionario:$('fbFuncionario').value.trim(),canal:$('fbCanal').value,estrelas:rating,mensagem:$('fbMsg').value.trim()};
    let ok=false;if(C.feedbackEndpoint){try{const r=await fetch(C.feedbackEndpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(record)});ok=r.ok}catch(e){console.warn(e)}}
    localSave(record);$('feedbackStatus').style.color='#1d9b69';setText('feedbackStatus',ok?'Avaliação enviada. Obrigado!':'Avaliação registrada neste aparelho.');$('fbMsg').value='';rating=0;document.querySelectorAll('.star').forEach(x=>x.classList.remove('on'));
  });

  renderUniforms();calc();

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if($('installBtn'))$('installBtn').hidden=false});
  if($('installBtn'))$('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$('installBtn').hidden=true}else if(/iPhone|iPad|iPod/.test(navigator.userAgent)){alert('No Safari: Compartilhar → Adicionar à Tela de Início.')}};
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(console.warn);
  console.info('Cora Família orçamento v4 carregado');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();