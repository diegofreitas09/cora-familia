(function(){
  function bind(){
    const b=document.getElementById('downloadQuotePdf');
    if(!b||b.dataset.pdfFinalV40==='1')return;
    b.dataset.pdfFinalV40='1';
    b.addEventListener('click',async function(ev){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const old=b.innerHTML;
      try{
        if(!window.CoraSaveV37||typeof window.CoraSaveV37.salvar!=='function')throw new Error('Salvamento do atendimento ainda não carregou.');
        b.disabled=true;b.textContent='Salvando e gerando PDF...';
        await window.CoraSaveV37.salvar({downloadLocal:true});
      }catch(e){console.error(e);alert(e.message||'Não foi possível gerar o PDF agora.');}
      finally{b.disabled=false;b.innerHTML=old;}
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,120));else setTimeout(bind,120);
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();