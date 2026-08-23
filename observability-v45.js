(()=>{
  const cfg=window.CORA_CONFIG?.observability||{};
  const buffer=[];
  const MAX=30;
  function push(type,payload){
    const item={type,at:new Date().toISOString(),...payload};
    buffer.push(item);if(buffer.length>MAX)buffer.shift();
    try{sessionStorage.setItem('cora_observability_buffer',JSON.stringify(buffer))}catch{}
    return item;
  }
  function loadSentry(){
    if(!cfg.sentryDsn||window.Sentry)return Promise.resolve(window.Sentry||null);
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src=cfg.sentryCdn||'https://browser.sentry-cdn.com/8.47.0/bundle.tracing.min.js';
      s.crossOrigin='anonymous';s.async=true;
      s.onload=()=>{try{window.Sentry?.init({dsn:cfg.sentryDsn,environment:cfg.environment||'production',release:cfg.release||'cora-familia-web',tracesSampleRate:Number(cfg.tracesSampleRate??0.05),sendDefaultPii:false});resolve(window.Sentry||null)}catch{resolve(null)}};
      s.onerror=()=>resolve(null);document.head.appendChild(s);
    });
  }
  function captureError(error,context={}){
    const message=error?.message||String(error||'Erro desconhecido');
    push('error',{message,context});
    try{if(window.Sentry?.captureException)window.Sentry.captureException(error instanceof Error?error:new Error(message),{extra:context})}catch{}
  }
  window.addEventListener('error',e=>captureError(e.error||e.message,{source:'window.error',file:e.filename,line:e.lineno,col:e.colno}));
  window.addEventListener('unhandledrejection',e=>captureError(e.reason,{source:'unhandledrejection'}));
  window.addEventListener('load',()=>{
    setTimeout(()=>{
      try{
        const nav=performance.getEntriesByType('navigation')[0];
        const paint=performance.getEntriesByType('paint');
        push('performance',{domContentLoaded:nav?Math.round(nav.domContentLoadedEventEnd):null,load:nav?Math.round(nav.loadEventEnd):null,paint:paint.map(x=>({name:x.name,startTime:Math.round(x.startTime)}))});
      }catch{}
    },0);
  },{once:true});
  window.CoraObservability={captureError,events:()=>buffer.slice(),config:cfg};
  loadSentry().catch(()=>{});
})();
