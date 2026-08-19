(function(){
  const API='https://script.google.com/macros/s/AKfycbwSpAtBgMjFyQ7J5yUxIfobEt0CxCGNgWEQZxp-mj9z-9zfWIcV2ig9iQlGzcCL5UYk/exec';
  const SHEET='Orçamentos Cora Família';
  const money=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const q=id=>document.getElementById(id);
  const safe=n=>Number.isFinite(Number(n))?Number(n):0;
  const session=()=>{try{return JSON.parse(localStorage.getItem('coraFamiliaAcessoV1')||'null')||{}}catch(e){return {}}};
  const uid=()=>`ORC-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  function ageFromBirth(v){if(!v)return'';const b=new Date(v+'T12:00:00');if(isNaN(b))return'';const now=new Date();let a=now.getFullYear()-b.getFullYear();const m=now.getMonth()-b.getMonth();if(m<0||(m===0&&now.getDate()<b.getDate()))a--;return Math.max(0,a)}
  function formatDateBR(v){if(!v)return'';const [y,m,d]=v.split('-');return d&&m&&y?`${d}/${m}/${y}`:v}
  function calc(){try{return typeof window.calcBudget==='function'?window.calcBudget():null}catch(e){return null}}
  function selectedItems(c){const a=[];if(!c)return a;if(c.includeAnnual)a.push(`Anuidade ${money(c.anuidade)}`);if(c.includeFirst&&!c.includeAnnual)a.push(`1ª parcela ${money(c.primeira)}`);if(c.includeMat)a.push(`Material didático ${money(c.material)}`);(c.uniformes||[]).forEach(u=>a.push(`${u.item} x${u.qt} ${money(u.sub)}`));return a}
  async function save(){
    const responsavel=(q('orcResponsavel')?.value||'').trim(),aluno=(q('orcAluno')?.value||'').trim(),nasc=q('orcNascimento')?.value||'',idade=ageFromBirth(nasc),status=q('orcSaveStatus'),btn=q('saveQuote');
    if(!responsavel||!aluno||!nasc){status.className='orc-status err';status.textContent='Preencha nome do responsável, nome do aluno e data de nascimento.';return}
    const c=calc();if(!c){status.className='orc-status err';status.textContent='Não foi possível calcular o orçamento agora.';return}
    const id=uid(),itens=selectedItems(c),data={
      'ID':id,
      'Data/Hora':new Date().toLocaleString('pt-BR',{timeZone:'America/Fortaleza'}),
      'Responsável':responsavel,
      'Aluno':aluno,
      'Data de nascimento':formatDateBR(nasc),
      'Idade':idade,
      'Série/Segmento':c.s?.nome||'',
      'Plano':c.plano==='A'?'Plano A — 1ª + 12 parcelas':'Plano B — 1ª + 11 parcelas',
      'Condição':c.cond==='ate'?'Até o vencimento':'Após o vencimento',
      '1ª Parcela':safe(c.includeFirst&&!c.includeAnnual?c.primeira:0),
      'Mensalidade/Parcela':safe(c.mensal),
      'Material didático':safe(c.includeMat?c.material:0),
      'Fardamento':safe(c.uniformTotal),
      'Total orçamento':safe(c.total),
      'Itens selecionados':itens.join(' | '),
      'Origem':'Cora Família'
    };
    btn.disabled=true;status.className='orc-status wait';status.textContent='Salvando atendimento...';
    try{
      await fetch(API,{method:'POST',mode:'no-cors',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'salvarRegistro',aba:SHEET,id,data})});
      await new Promise(r=>setTimeout(r,900));
      let count='';
      try{const u=API+'?action=listar&aba='+encodeURIComponent(SHEET)+'&_='+Date.now();const rr=await fetch(u,{cache:'no-store'});const j=await rr.json();const rows=Array.isArray(j.rows)?j.rows:[];count=rows.length;const ok=rows.some(x=>String(x.ID||'')===id);if(!ok)throw new Error('registro não localizado')}catch(e){}
      localStorage.setItem('coraFamiliaUltimoOrcamento',JSON.stringify({id,data}));
      status.className='orc-status ok';status.textContent=`✅ Orçamento salvo${count!==''?` • ${count} atendimento${count===1?'':'s'} registrado${count===1?'':'s'}`:''}.`;
      q('orcCounter')&&(q('orcCounter').textContent=count!==''?`${count} orçamentos registrados`:'Registro enviado');
    }catch(e){console.error(e);status.className='orc-status err';status.textContent='Não foi possível salvar agora. Tente novamente.'}finally{btn.disabled=false}
  }
  async function loadCount(){try{const u=API+'?action=listar&aba='+encodeURIComponent(SHEET)+'&_='+Date.now();const rr=await fetch(u,{cache:'no-store'}),j=await rr.json(),rows=Array.isArray(j.rows)?j.rows:[];if(q('orcCounter'))q('orcCounter').textContent=`${rows.length} orçamentos registrados`}catch(e){}}
  function render(){
    const page=q('orcamento');if(!page||q('orcClientBox'))return;
    const sess=session();const anchor=page.querySelector('.formgrid');if(!anchor)return;
    const box=document.createElement('div');box.id='orcClientBox';box.className='card orc-client-box';
    box.innerHTML=`<div class="orc-head"><div><small>IDENTIFICAÇÃO DO ATENDIMENTO</small><h3>Dados da família</h3><p>Esses dados serão registrados junto com o orçamento para acompanhamento dos atendimentos realizados.</p></div><span id="orcCounter">Carregando registros...</span></div><div class="orc-grid"><div class="field"><label>Nome do responsável</label><input id="orcResponsavel" autocomplete="name" placeholder="Nome completo" value="${String(sess.responsavel||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Nome do aluno</label><input id="orcAluno" autocomplete="off" placeholder="Nome completo do aluno" value="${String(sess.aluno||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Data de nascimento</label><input id="orcNascimento" type="date"></div><div class="field"><label>Idade</label><input id="orcIdade" readonly placeholder="Calculada automaticamente"></div></div>`;
    anchor.parentNode.insertBefore(box,anchor);
    q('orcNascimento').addEventListener('change',()=>{q('orcIdade').value=ageFromBirth(q('orcNascimento').value)!==''?ageFromBirth(q('orcNascimento').value)+' anos':''});
    const actions=page.querySelector('.quote-actions');if(actions&&!q('saveQuote')){const b=document.createElement('button');b.id='saveQuote';b.className='primary';b.type='button';b.textContent='💾 Salvar orçamento';b.onclick=save;actions.insertBefore(b,actions.firstChild);const st=document.createElement('div');st.id='orcSaveStatus';st.className='orc-status';actions.insertAdjacentElement('afterend',st)}
    loadCount();
  }
  function style(){if(q('orc30style'))return;const s=document.createElement('style');s.id='orc30style';s.textContent=`.orc-client-box{margin-bottom:16px;border:1px solid #d6e5f3}.orc-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:14px}.orc-head small{font-weight:900;color:#0f5ea8;letter-spacing:.06em}.orc-head h3{margin:4px 0 5px;color:#0d315c;font-size:22px}.orc-head p{margin:0;color:#627b94}.orc-head span{white-space:nowrap;background:#e8f4ff;color:#0f5ea8;border-radius:999px;padding:8px 12px;font-weight:900;font-size:12px}.orc-grid{display:grid;grid-template-columns:1.2fr 1.2fr .8fr .6fr;gap:12px}.orc-status{margin-top:10px;min-height:20px;font-weight:800}.orc-status.ok{color:#168047}.orc-status.err{color:#b42318}.orc-status.wait{color:#1767b0}#saveQuote{background:#1767b0!important}@media(max-width:900px){.orc-grid{grid-template-columns:1fr 1fr}.orc-head{display:block}.orc-head span{display:inline-block;margin-top:10px}}@media(max-width:560px){.orc-grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
  function init(){style();render();new MutationObserver(render).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();