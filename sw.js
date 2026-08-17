const C='cora-familia-v16';
const A=['./','./index.html','./app.css','./app.js','./config.js','./data.js','./manifest.webmanifest','./logo-escola.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./fachada-data.txt'];

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

async function fachadaResponse(){
  const r=await fetch('./fachada-data.txt?ts='+Date.now(),{cache:'no-store'});
  const txt=(await r.text()).trim();
  const b64=txt.replace(/^data:image\/jpeg;base64,/, '');
  const bin=atob(b64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return new Response(bytes,{headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store'}});
}

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.pathname.endsWith('/fachada-cora-familia-web.jpg') || url.pathname.endsWith('/fachada-cora-familia.jpg')){
    e.respondWith(fachadaResponse());
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{
    const clone=r.clone();
    caches.open(C).then(c=>c.put(e.request,clone));
    return r;
  }).catch(()=>caches.match(e.request)));
});
