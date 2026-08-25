const CACHE='cora-familia-v50';
const CORE=['./','./index.html','./app.css','./app.js','./auth.js','./config.js','./data.js','./manifest.webmanifest','./logo-escola.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./motion-professional-v44.css','./landing-professional-v46.css','./motion-professional-v44.js','./observability-v45.js','./landing-professional-v46.js'];

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

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  const isNavigation=event.request.mode==='navigate'||url.pathname.endsWith('/cora-familia/')||url.pathname.endsWith('/cora-familia/index.html');
  if(isNavigation){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy)).catch(()=>{});
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
