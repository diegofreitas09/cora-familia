(function(){
  const API='https://script.google.com/macros/s/AKfycbwSpAtBgMjFyQ7J5yUxIfobEt0CxCGNgWEQZxp-mj9z-9zfWIcV2ig9iQlGzcCL5UYk/exec';
  const SHEET='Orçamentos Cora Família';
  const q=id=>document.getElementById(id);
  const safe=n=>Number.isFinite(Number(n))?Number(n):0;
  const uid=()=>`ORC-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  function age(v){if(!v)return'';const b=new Date(v+'T12:00:00'),h=new Date();if(isNaN(b))return'';let a=h.getFullYear()-b.getFullYear(),m=h.getMonth()-b.getMonth();if(m<0||(m===0&&h.getDate()<b.getDate()))a--;return Math.max(0,a)}
  function dateBR(v){if(!v)return'';const [y,m,d]=v.split('-');return d&&m&&y?`${d}/${m}/${y}`:v}
  async function post(payload){await fetch(API,{method:'POST',mode:'no-cors',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)})}
  async function confirmar(id){for(let i=0;i<4;i++){await new Promise(r=>setTimeout(r,700));try{const r=await fetch(API+'?action=listar&aba='+encodeURIComponent(SHEET)+'&_='+Date.now(),{cache:'no-store'}),j=await r.json(),rows=Array.isArray(j.rows)?j.rows:[];if(rows.some(x=>String(x.ID||'')===id))return rows.length}catch(e){}}return false}
  async function salvar(){
    const st=q('orcSaveStatus'),btn=q('saveQuote');
    const responsavel=(q('orcResponsavel')?.value||'').trim(),aluno=(q('orcAluno')?.value||'').trim(),nasc=q('orcNascimento')?.value||'',obs=(q('orcObservacoes')?.value||'').trim();
    if(!responsavel||!aluno||!nasc){if(st){st.className='orc-status err';st.textContent='Preencha responsável, aluno e data de nascimento.'}return}
    if(typeof window.calcBudget!=='function'){if(st)st.textContent='Orçamento indisponível.';return}
    const c=window.calcBudget(),id=uid(),dataHora=new Date().toLocaleString('pt-BR',{timeZone:'America/Fortaleza'});
    if(!c||c.count===0){if(st){st.className='orc-status err';st.textContent='Selecione pelo menos um item.'}return}
    const itens=[];if(c.includeAnnual)itens.push(`Anuidade R$ ${Number(c.anuidade).toLocaleString('pt-BR',{minimumFractionDigits:2})}`);if(c.includeFirst&&!c.includeAnnual)itens.push(`1ª parcela R$ ${Number(c.primeira).toLocaleString('pt-BR',{minimumFractionDigits:2})}`);if(c.includeMat)itens.push(`Material didático R$ ${Number(c.material).toLocaleString('pt-BR',{minimumFractionDigits:2})}`);(c.uniformes||[]).forEach(u=>itens.push(`${u.item} x${u.qt} R$ ${Number(u.sub).toLocaleString('pt-BR',{minimumFractionDigits:2})}`));
    const data={'ID':id,'Data/Hora':dataHora,'Responsável':responsavel,'Aluno':aluno,'Data de nascimento':dateBR(nasc),'Idade':age(nasc),'Série/Segmento':c.s?.nome||'','Plano':c.plano==='A'?'Plano A — 1ª + 12 parcelas':'Plano B — 1ª + 11 parcelas','Condição':c.cond==='ate'?'Até o vencimento':'Após o vencimento','1ª Parcela':safe(c.primeira),'Mensalidade/Parcela':safe(c.mensal),'Quantidade parcelas':safe(c.parcelas),'Anuidade':safe(c.anuidade),'Material didático':safe(c.includeMat?c.material:0),'Fardamento':safe(c.uniformTotal),'Total orçamento':safe(c.total),'Itens selecionados':itens.join(' | '),'Origem':'Cora Família','Observações':obs};
    if(btn)btn.disabled=true;if(st){st.className='orc-status wait';st.textContent='Salvando orçamento e o mesmo PDF no Drive...'}
    try{
      await post({action:'salvarRegistro',aba:SHEET,id,data});
      let pdf=null;if(window.CoraPdfV37?.gerar)pdf=await window.CoraPdfV37.gerar({download:false,id,dataHora});
      if(pdf?.base64)await post({action:'salvarPdfBase64',id,filename:pdf.filename,pdfBase64:pdf.base64});else await post({action:'salvarPdfOrcamento',id,data});
      const total=await confirmar(id);localStorage.setItem('coraFamiliaUltimoOrcamento',JSON.stringify({id,data}));
      if(total!==false){if(st){st.className='orc-status ok';st.textContent=`✅ Orçamento confirmado na planilha e PDF enviado ao Drive • ${total} atendimento${total===1?'':'s'}.`}if(q('orcCounter'))q('orcCounter').textContent=`${total} orçamentos registrados`}else{if(st){st.className='orc-status err';st.textContent='⚠️ O envio foi feito, mas ainda não consegui confirmar o registro na planilha.'}}
    }catch(e){console.error(e);if(st){st.className='orc-status err';st.textContent='Não foi possível salvar agora.'}}finally{if(btn)btn.disabled=false}
  }
  function bind(){const b=q('saveQuote');if(b&&b.dataset.v37!=='1'){b.dataset.v37='1';b.textContent='💾 Salvar orçamento + PDF';b.onclick=salvar}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,80));else setTimeout(bind,80);new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();