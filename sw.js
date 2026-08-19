const C='cora-familia-v27';
const A=['./','./index.html','./app.css','./app.js','./auth.js','./config.js','./data.js','./cora-gestao-sync-v27.js','./pdf-download.js','./manifest.webmanifest','./logo-escola.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./fachada-cora-familia.jpg'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c=>c.addAll(A)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);

  if(url.origin===self.location.origin&&(url.pathname.endsWith('/cora-familia/')||url.pathname.endsWith('/cora-familia/index.html'))){
    e.respondWith(
      fetch(e.request,{cache:'no-store'}).then(async r=>{
        let html=await r.text();
        if(!html.includes('cora-gestao-sync-v27.js')) html=html.replace('</body>',"<script src='cora-gestao-sync-v27.js?v=1'></script></body>");
        if(!html.includes('pdf-download.js')) html=html.replace('</body>',"<script src='pdf-download.js?v=2'></script></body>");
        const out=new Response(html,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate'}});
        caches.open(C).then(c=>c.put(e.request,out.clone())).catch(()=>{});
        return out;
      }).catch(()=>caches.match(e.request).then(async r=>{
        if(!r)return caches.match('./index.html');
        let html=await r.text();
        if(!html.includes('cora-gestao-sync-v27.js')) html=html.replace('</body>',"<script src='cora-gestao-sync-v27.js?v=1'></script></body>");
        if(!html.includes('pdf-download.js')) html=html.replace('</body>',"<script src='pdf-download.js?v=2'></script></body>");
        return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      }))
    );
    return;
  }

  if(url.origin===self.location.origin&&['/app.js','/data.js','/cora-gestao-sync-v27.js'].some(x=>url.pathname.endsWith(x))){
    e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
    return;
  }

  e.respondWith(
    fetch(e.request).then(r=>{
      const clone=r.clone();
      caches.open(C).then(c=>c.put(e.request,clone)).catch(()=>{});
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});