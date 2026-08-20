(function(){
  const API='https://script.google.com/macros/s/AKfycbwSpAtBgMjFyQ7J5yUxIfobEt0CxCGNgWEQZxp-mj9z-9zfWIcV2ig9iQlGzcCL5UYk/exec';
  const SHEET='Orçamentos Cora Família';
  const money=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const q=id=>document.getElementById(id);
  const safe=n=>Number.isFinite(Number(n))?Number(n):0;
  const session=()=>{try{return JSON.parse(localStorage.getItem('coraFamiliaAcessoV1')||'null')||{}}catch(e){return {}}};
  const uid=()=>`ORC-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;

  function parseBirth(v){
    const s=String(v||'').trim();
    let d,m,y;
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)){[y,m,d]=s.split('-').map(Number)}
    else if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){[d,m,y]=s.split('/').map(Number)}
    else return null;
    const dt=new Date(y,m-1,d,12,0,0);
    if(dt.getFullYear()!==y||dt.getMonth()!==m-1||dt.getDate()!==d)return null;
    if(y<1900||dt>new Date())return null;
    const pad=n=>String(n).padStart(2,'0');
    return{date:dt,iso:`${y}-${pad(m)}-${pad(d)}`,br:`${pad(d)}/${pad(m)}/${y}`};
  }
  function ageFromBirth(v){const p=parseBirth(v);if(!p)return'';const b=p.date,now=new Date();let a=now.getFullYear()-b.getFullYear();const m=now.getMonth()-b.getMonth();if(m<0||(m===0&&now.getDate()<b.getDate()))a--;return Math.max(0,a)}
  function formatDateBR(v){const p=parseBirth(v);return p?p.br:String(v||'')}
  function maskBirth(v){const n=String(v||'').replace(/\D/g,'').slice(0,8);if(n.length<=2)return n;if(n.length<=4)return n.slice(0,2)+'/'+n.slice(2);return n.slice(0,2)+'/'+n.slice(2,4)+'/'+n.slice(4)}
  function updateAge(){const el=q('orcNascimento'),age=q('orcIdade');if(!el||!age)return;const a=ageFromBirth(el.value);age.value=a!==''?a+' anos':'';el.classList.toggle('orc-date-invalid',el.value.length===10&&!parseBirth(el.value));}
  function calc(){try{return typeof window.calcBudget==='function'?window.calcBudget():null}catch(e){return null}}
  function selectedItems(c){const a=[];if(!c)return a;if(c.includeAnnual)a.push(`Anuidade ${money(c.anuidade)}`);if(c.includeFirst&&!c.includeAnnual)a.push(`1ª parcela ${money(c.primeira)}`);if(c.includeMat)a.push(`Material didático ${money(c.material)}`);(c.uniformes||[]).forEach(u=>a.push(`${u.item} x${u.qt} ${money(u.sub)}`));return a}
  async function post(payload){await fetch(API,{method:'POST',mode:'no-cors',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)})}
  async function save(){
    const responsavel=(q('orcResponsavel')?.value||'').trim(),aluno=(q('orcAluno')?.value||'').trim(),nasc=q('orcNascimento')?.value||'',birth=parseBirth(nasc),idade=ageFromBirth(nasc),observacoes=(q('orcObservacoes')?.value||'').trim(),status=q('orcSaveStatus'),btn=q('saveQuote');
    if(!responsavel||!aluno||!nasc){status.className='orc-status err';status.textContent='Preencha nome do responsável, nome do aluno e data de nascimento.';return}
    if(!birth){status.className='orc-status err';status.textContent='Informe uma data de nascimento válida no formato DD/MM/AAAA.';q('orcNascimento')?.focus();return}
    const c=calc();if(!c){status.className='orc-status err';status.textContent='Não foi possível calcular o orçamento agora.';return}
    const id=uid(),itens=selectedItems(c),data={
      'ID':id,
      'Data/Hora':new Date().toLocaleString('pt-BR',{timeZone:'America/Fortaleza'}),
      'Responsável':responsavel,
      'Aluno':aluno,
      'Data de nascimento':birth.br,
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
      'Origem':'Cora Família',
      'Observações':observacoes
    };
    btn.disabled=true;status.className='orc-status wait';status.textContent='Salvando atendimento e PDF no Drive...';
    try{
      await post({action:'salvarRegistro',aba:SHEET,id,data});
      await new Promise(r=>setTimeout(r,500));
      await post({action:'salvarPdfOrcamento',id,data});
      await new Promise(r=>setTimeout(r,1200));
      let count='';
      try{const u=API+'?action=listar&aba='+encodeURIComponent(SHEET)+'&_='+Date.now();const rr=await fetch(u,{cache:'no-store'});const j=await rr.json();const rows=Array.isArray(j.rows)?j.rows:[];count=rows.length;const ok=rows.some(x=>String(x.ID||'')===id);if(!ok)throw new Error('registro não localizado')}catch(e){}
      localStorage.setItem('coraFamiliaUltimoOrcamento',JSON.stringify({id,data}));
      status.className='orc-status ok';status.textContent=`✅ Orçamento salvo na planilha e enviado para a pasta do Drive${count!==''?` • ${count} atendimento${count===1?'':'s'} registrado${count===1?'':'s'}`:''}.`;
      q('orcCounter')&&(q('orcCounter').textContent=count!==''?`${count} orçamentos registrados`:'Registro enviado');
    }catch(e){console.error(e);status.className='orc-status err';status.textContent='Não foi possível salvar agora. Tente novamente.'}finally{btn.disabled=false}
  }
  async function loadCount(){try{const u=API+'?action=listar&aba='+encodeURIComponent(SHEET)+'&_='+Date.now();const rr=await fetch(u,{cache:'no-store'}),j=await rr.json(),rows=Array.isArray(j.rows)?j.rows:[];if(q('orcCounter'))q('orcCounter').textContent=`${rows.length} orçamentos registrados`}catch(e){}}
  function render(){
    const page=q('orcamento');if(!page||q('orcClientBox'))return;
    const sess=session();const anchor=page.querySelector('.formgrid');if(!anchor)return;
    const box=document.createElement('div');box.id='orcClientBox';box.className='card orc-client-box';
    box.innerHTML=`<div class="orc-head"><div><small>IDENTIFICAÇÃO DO ATENDIMENTO</small><h3>Dados da família</h3><p>Esses dados serão registrados junto com o orçamento para acompanhamento dos atendimentos realizados.</p></div><span id="orcCounter">Carregando registros...</span></div><div class="orc-grid"><div class="field"><label>Nome do responsável</label><input id="orcResponsavel" autocomplete="name" placeholder="Nome completo" value="${String(sess.responsavel||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Nome do aluno</label><input id="orcAluno" autocomplete="off" placeholder="Nome completo do aluno" value="${String(sess.aluno||'').replace(/"/g,'&quot;')}"></div><div class="field"><label>Data de nascimento</label><input id="orcNascimento" type="text" inputmode="numeric" autocomplete="bday" maxlength="10" placeholder="DD/MM/AAAA" aria-label="Data de nascimento no formato dia mês ano"><small class="orc-date-help">Digite somente os números. Ex.: 15032014</small></div><div class="field"><label>Idade</label><input id="orcIdade" readonly placeholder="Calculada automaticamente"></div></div><div class="field orc-observacoes"><label>Observações do atendimento / orçamento</label><textarea id="orcObservacoes" rows="4" placeholder="Ex.: condição combinada com a família, interesse em turno específico, retorno agendado, observações sobre material ou fardamento..."></textarea></div>`;
    anchor.parentNode.insertBefore(box,anchor);
    const nasc=q('orcNascimento');
    nasc.addEventListener('input',()=>{const pos=nasc.selectionStart;nasc.value=maskBirth(nasc.value);updateAge()});
    nasc.addEventListener('blur',updateAge);
    nasc.addEventListener('paste',()=>setTimeout(()=>{nasc.value=maskBirth(nasc.value);updateAge()},0));
    const actions=page.querySelector('.quote-actions');if(actions&&!q('saveQuote')){const b=document.createElement('button');b.id='saveQuote';b.className='primary';b.type='button';b.textContent='💾 Salvar orçamento + PDF';b.onclick=save;actions.insertBefore(b,actions.firstChild);const st=document.createElement('div');st.id='orcSaveStatus';st.className='orc-status';actions.insertAdjacentElement('afterend',st)}
    loadCount();
  }
  function style(){if(q('orc30style'))return;const s=document.createElement('style');s.id='orc30style';s.textContent=`.orc-client-box{margin-bottom:16px;border:1px solid #d6e5f3}.orc-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:14px}.orc-head small{font-weight:900;color:#0f5ea8;letter-spacing:.06em}.orc-head h3{margin:4px 0 5px;color:#0d315c;font-size:22px}.orc-head p{margin:0;color:#627b94}.orc-head span{white-space:nowrap;background:#e8f4ff;color:#0f5ea8;border-radius:999px;padding:8px 12px;font-weight:900;font-size:12px}.orc-grid{display:grid;grid-template-columns:1.2fr 1.2fr .8fr .6fr;gap:12px}.orc-observacoes{margin-top:14px}.orc-observacoes textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:88px;border:1px solid #bfd1e5;border-radius:12px;padding:12px 13px;font:inherit;background:#fff;color:#173a63}.orc-date-help{display:block;margin-top:5px;color:#72869a;font-size:11px;font-weight:600;letter-spacing:0}.orc-date-invalid{border-color:#d92d20!important;background:#fff5f5!important}.orc-status{margin-top:10px;min-height:20px;font-weight:800}.orc-status.ok{color:#168047}.orc-status.err{color:#b42318}.orc-status.wait{color:#1767b0}#saveQuote{background:#1767b0!important}@media(max-width:900px){.orc-grid{grid-template-columns:1fr 1fr}.orc-head{display:block}.orc-head span{display:inline-block;margin-top:10px}}@media(max-width:560px){.orc-grid{grid-template-columns:1fr}#orcNascimento{font-size:18px;letter-spacing:.04em;min-height:48px}}`;document.head.appendChild(s)}
  function init(){style();render();new MutationObserver(render).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();