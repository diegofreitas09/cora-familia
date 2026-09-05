const CACHE='familia360-master-v2';
const LIVE_SCRIPT=`<script type="module">
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/+esm';
const rt=createClient('https://kevillefdybgadutiypo.supabase.co','sb_publishable_Bpx1O-662JPP4uH0bDHS9g_ymXISucW',{auth:{persistSession:true,autoRefreshToken:true}});
let livePending=false;
const liveRefresh=()=>{if(livePending)return;livePending=true;setTimeout(()=>{document.getElementById('refresh')?.click();livePending=false},200)};
rt.channel('f360-master-live').on('postgres_changes',{event:'*',schema:'public',table:'device_locations'},liveRefresh).on('postgres_changes',{event:'*',schema:'public',table:'user_devices'},liveRefresh).subscribe();
</script>`;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
])));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||event.request.mode!=='navigate')return;
  event.respondWith((async()=>{
    try{
      const res=await fetch(event.request,{cache:'no-store'});
      const ct=res.headers.get('content-type')||'';
      if(!res.ok||!ct.includes('text/html'))return res;
      let html=await res.text();
      if(!html.includes('f360-master-live')) html=html.replace('</body>',LIVE_SCRIPT+'</body>');
      const headers=new Headers(res.headers);headers.set('content-type','text/html; charset=utf-8');headers.set('cache-control','no-store');
      const out=new Response(html,{status:res.status,statusText:res.statusText,headers});
      const cache=await caches.open(CACHE);await cache.put('./',out.clone());
      return out;
    }catch(e){
      const cached=await caches.match('./');
      return cached||new Response('Família 360 temporariamente indisponível',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
    }
  })());
});