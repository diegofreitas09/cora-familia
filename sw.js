const C='cora-familia-v40';
const A=['./','./index.html','./app.css','./app.js','./auth.js','./config.js','./data.js','./cora-gestao-sync-v27.js','./orcamento-primeira-fix-v29.js','./orcamentos-registro-v30.js','./orcamento-verificacao-v35.js','./pdf-unificado-v37.js','./orcamento-save-v37.js','./pdf-final-fix-v40.js','./manifest.webmanifest','./logo-escola.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./fachada-cora-familia.jpg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.origin===self.location.origin&&(url.pathname.endsWith('/cora-familia/')||url.pathname.endsWith('/cora-familia/index.html'))){
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{let html=await r.text();
   html=html.replace(/<script[^>]+src=["'][^"']*pdf-download\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,'');
   html=html.replace(/<script[^>]+src=["'][^"']*pdf-condicoes-v38\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,'');
   html=html.replace(/<script[^>]+src=["'][^"']*pdf-unificado-v37\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,'');
   html=html.replace(/<script[^>]+src=["'][^"']*orcamento-save-v37\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,'');
   html=html.replace(/<script[^>]+src=["'][^"']*pdf-final-fix-v40\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,'');
   html=html.replace(/cora-gestao-sync-v27\.js(?:\?v=\d+)?/g,'cora-gestao-sync-v27.js?v=3').replace(/orcamento-primeira-fix-v29\.js(?:\?v=\d+)?/g,'orcamento-primeira-fix-v29.js?v=1').replace(/orcamentos-registro-v30\.js(?:\?v=\d+)?/g,'orcamentos-registro-v30.js?v=4').replace(/orcamento-verificacao-v35\.js(?:\?v=\d+)?/g,'orcamento-verificacao-v35.js?v=1');
   if(!html.includes('orcamentos-registro-v30.js'))html=html.replace('</body>',"<script src='orcamentos-registro-v30.js?v=4'></script></body>");
   if(!html.includes('orcamento-verificacao-v35.js'))html=html.replace('</body>',"<script src='orcamento-verificacao-v35.js?v=1'></script></body>");
   html=html.replace('</body>',"<script src='pdf-unificado-v37.js?v=3'></script><script src='orcamento-save-v37.js?v=2'></script><script src='pdf-final-fix-v40.js?v=1'></script></body>");
   return new Response(html,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate'}})
  }).catch(()=>caches.match('./index.html')));return;
 }
 if(url.origin===self.location.origin&&['/app.js','/data.js','/cora-gestao-sync-v27.js','/orcamento-primeira-fix-v29.js','/orcamentos-registro-v30.js','/orcamento-verificacao-v35.js','/pdf-unificado-v37.js','/orcamento-save-v37.js','/pdf-final-fix-v40.js'].some(x=>url.pathname.endsWith(x))){e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));return}
 e.respondWith(fetch(e.request).then(r=>{const clone=r.clone();caches.open(C).then(c=>c.put(e.request,clone)).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});