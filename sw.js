const C='cora-familia-v12';
const A=['./','./index.html','./app.css','./app.js','./config.js','./data.js','./manifest.webmanifest','./logo-escola.png','./fachada-part1.txt','./fachada-part2.txt','./fachada-part3.txt','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

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

async function facadeResponse(){
  const parts=await Promise.all([
    fetch('./fachada-part1.txt',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('parte 1');return r.text()}),
    fetch('./fachada-part2.txt',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('parte 2');return r.text()}),
    fetch('./fachada-part3.txt',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('parte 3');return r.text()})
  ]);
  const base64=parts.join('').replace(/\s+/g,'');
  const bin=atob(base64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new Response(bytes,{status:200,headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store'}});
}

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.pathname.endsWith('/fachada-cora-familia.jpg')){
    e.respondWith(facadeResponse());
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{
    const clone=r.clone();
    caches.open(C).then(c=>c.put(e.request,clone));
    return r;
  }).catch(()=>caches.match(e.request)));
});