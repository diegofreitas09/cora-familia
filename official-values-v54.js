(function(){
  'use strict';
  if(window.__CORA_OFFICIAL_VALUES_V54__) return;
  window.__CORA_OFFICIAL_VALUES_V54__=true;

  const OFFICIAL={
    'Educação Infantil':{anuidadeAte:6142.15,anuidadeApos:6431.28,primeira:599,planoA:{ate:461.93,apos:486.02,parcelas:12},planoB:{ate:503.92,apos:530.21,parcelas:11}},
    'Fundamental I':{anuidadeAte:6551.65,anuidadeApos:6861.61,primeira:599,planoA:{ate:496.05,apos:521.88,parcelas:12},planoB:{ate:541.15,apos:569.33,parcelas:11}},
    'Fundamental II':{anuidadeAte:7138.41,anuidadeApos:7478.74,primeira:599,planoA:{ate:544.95,apos:573.31,parcelas:12},planoB:{ate:594.49,apos:625.43,parcelas:11}},
    'Ensino Médio':{anuidadeAte:7730.29,anuidadeApos:8101.33,primeira:599,planoA:{ate:594.27,apos:625.19,parcelas:12},planoB:{ate:648.30,apos:682.03,parcelas:11}}
  };

  function clone(o){return JSON.parse(JSON.stringify(o));}
  function ensureFallback(){
    if(!window.CORA_DATA) return false;
    window.CORA_DATA.mensalidades=window.CORA_DATA.mensalidades||{};
    Object.entries(OFFICIAL).forEach(([seg,val])=>{
      const cur=window.CORA_DATA.mensalidades[seg]||{};
      if(!cur || Number(cur.primeira)===600 || !Number(cur.primeira)) window.CORA_DATA.mensalidades[seg]=clone(val);
    });
    window.CORA_DATA.meta=window.CORA_DATA.meta||{};
    window.CORA_DATA.meta.fallbackOficialVersao='54';
    window.CORA_DATA.meta.fallbackOficialEm='31/08/2026 19:47:02';
    return true;
  }
  function repaint(){
    try{if(typeof window.renderValues==='function')window.renderValues();}catch(e){}
    try{if(typeof window.renderBudget==='function')window.renderBudget();}catch(e){}
    try{if(typeof window.CoraFamiliaBudgetFix==='function')window.CoraFamiliaBudgetFix();}catch(e){}
  }
  async function refreshCloud(){
    ensureFallback();repaint();
    try{
      if(window.CoraFamiliaGestaoSync&&typeof window.CoraFamiliaGestaoSync.sync==='function'){
        const n=await window.CoraFamiliaGestaoSync.sync(true);
        if(!n) ensureFallback();
        repaint();
      }
    }catch(e){ensureFallback();repaint();}
  }
  ensureFallback();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshCloud,150));
  else setTimeout(refreshCloud,150);
  window.addEventListener('pageshow',()=>setTimeout(refreshCloud,100));
  window.CoraOfficialValuesV54={refresh:refreshCloud,fallback:OFFICIAL,version:'54'};
})();