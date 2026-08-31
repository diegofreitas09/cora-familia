const CACHE='cora-familia-v54';
const CORE=['./','./index.html','./app.css','./app.js','./auth.js','./config.js','./data.js','./manifest.webmanifest','./logo-escola.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./motion-professional-v44.css','./landing-professional-v46.css','./motion-professional-v44.js','./observability-v45.js','./landing-professional-v46.js','./cora-gestao-sync-v27.js','./official-values-v54.js','./orcamento-primeira-fix-v29.js','./orcamentos-registro-v30.js','./orcamento-verificacao-v35.js','./orcamento-save-v37.js','./pdf-unificado-v37.js','./pdf-condicoes-v38.js','./pdf-download.js','./pdf-final-fix-v40.js'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function injectOfficial(html){
  html=html.replace(/<script[^>]+src=['\"]official-values-v54\.js[^'\"]*['\"][^>]*><\/script>/ig,'');
  return html.replace('</body>',"<script src='official-values-v54.js?v=54'></script></body>");
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const isNavigation=event.request.mode==='navigate'||url.pathname.endsWith('/cora-familia/')||url.pathname.endsWith('/cora-familia/index.html');
  if(isNavigation){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(async response=>{
          const html=injectOfficial(await response.text());
          const out=new Response(html,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate'}});
          caches.open(CACHE).then(cache=>cache.put('./index.html',out.clone())).catch(()=>{});
          return out;
        })
        .catch(()=>caches.match('./index.html').then(async response=>{
          if(!response)return new Response('Offline',{status:503});
          const html=injectOfficial(await response.text());
          return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
        }))
    );
    return;
  }
  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});