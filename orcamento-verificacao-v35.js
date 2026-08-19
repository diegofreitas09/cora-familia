(function(){
  const API='https://script.google.com/macros/s/AKfycbwSpAtBgMjFyQ7J5yUxIfobEt0CxCGNgWEQZxp-mj9z-9zfWIcV2ig9iQlGzcCL5UYk/exec';
  const SHEET='Orçamentos Cora Família';
  const q=id=>document.getElementById(id);

  async function verificarUltimo(){
    await new Promise(r=>setTimeout(r,2600));
    let ultimo=null;
    try{ultimo=JSON.parse(localStorage.getItem('coraFamiliaUltimoOrcamento')||'null')}catch(e){}
    const id=ultimo&&ultimo.id;
    if(!id)return;
    const status=q('orcSaveStatus');
    try{
      const url=API+'?action=listar&aba='+encodeURIComponent(SHEET)+'&_='+Date.now();
      const resp=await fetch(url,{cache:'no-store',redirect:'follow'});
      if(!resp.ok)throw new Error('HTTP '+resp.status);
      const ct=(resp.headers.get('content-type')||'').toLowerCase();
      if(!ct.includes('json'))throw new Error('endpoint sem acesso público');
      const j=await resp.json();
      const rows=Array.isArray(j.rows)?j.rows:[];
      const row=rows.find(x=>String(x.ID||'')===String(id));
      if(!row){
        if(status){status.className='orc-status err';status.textContent='❌ O orçamento NÃO foi gravado na planilha. O acesso do Apps Script precisa estar liberado para qualquer pessoa.';}
        return;
      }
      if(status){
        const pdf=String(row['PDF Drive']||'').trim();
        status.className='orc-status ok';
        status.textContent=pdf?'✅ Salvamento confirmado: planilha + PDF no Drive.':'✅ Salvamento confirmado na planilha. O PDF ainda está sendo processado no Drive.';
      }
    }catch(e){
      console.error('Falha na verificação do orçamento',e);
      if(status){status.className='orc-status err';status.textContent='❌ Não foi possível confirmar o salvamento. Verifique se a implantação do Apps Script está com acesso: Qualquer pessoa.';}
    }
  }

  function instalar(){
    const btn=q('saveQuote');
    if(!btn||btn.dataset.verify35)return;
    btn.dataset.verify35='1';
    btn.addEventListener('click',()=>setTimeout(verificarUltimo,200));
  }
  function init(){instalar();new MutationObserver(instalar).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();