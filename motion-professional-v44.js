(()=>{
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  let pending=0,hideTimer=null;
  function ensureStyle(){if(!document.querySelector('link[data-cora-motion],link[href*="motion-professional-v44.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='motion-professional-v44.css?v=1';l.dataset.coraMotion='1';document.head.appendChild(l)}}
  function ensureUi(){
    if(!q('#coraNetProgress')){const bar=document.createElement('div');bar.id='coraNetProgress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar)}
    if(!q('#coraBootSkeleton')){const sk=document.createElement('div');sk.id='coraBootSkeleton';sk.setAttribute('aria-hidden','true');sk.innerHTML='<div class="cora-sk-head"><i></i><span></span><b></b></div><div class="cora-sk-nav"></div><main><div class="cora-sk-hero"></div><div class="cora-sk-grid"><div></div><div></div><div></div></div></main>';document.body.appendChild(sk)}
  }
  function setBusy(on){const bar=q('#coraNetProgress');if(!bar)return;document.documentElement.classList.toggle('cora-network-busy',on);bar.classList.toggle('show',on);document.body?.setAttribute('aria-busy',on?'true':'false')}
  function begin(){pending++;clearTimeout(hideTimer);setBusy(true)}
  function end(){pending=Math.max(0,pending-1);if(!pending)hideTimer=setTimeout(()=>setBusy(false),reduced?0:120)}
  function wrapFetch(){if(window.__coraFetchWrapped)return;window.__coraFetchWrapped=true;const original=window.fetch.bind(window);window.fetch=(...args)=>{begin();return original(...args).finally(end)}}
  function enhanceImages(){qa('img').forEach((img,i)=>{if(i>0&&!img.hasAttribute('loading'))img.loading='lazy';if(!img.hasAttribute('decoding'))img.decoding='async'})}
  function animatePage(page){if(reduced||!page)return;page.animate([{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'})}
  function bindNavigation(){const obs=new MutationObserver(muts=>{for(const m of muts){if(m.type==='attributes'&&m.target.classList?.contains('page')&&m.target.classList.contains('active'))animatePage(m.target)}});qa('.page').forEach(p=>{obs.observe(p,{attributes:true,attributeFilter:['class']})})}
  function press(btn){if(btn.disabled)return;btn.classList.add('cora-pressed');setTimeout(()=>btn.classList.remove('cora-pressed'),reduced?0:160)}
  function bindAsyncButtons(){qa('button').forEach(btn=>{if(btn.dataset.motionBound)return;btn.dataset.motionBound='1';btn.addEventListener('click',()=>press(btn),{passive:true})});new MutationObserver(()=>qa('button').forEach(btn=>{if(!btn.dataset.motionBound){btn.dataset.motionBound='1';btn.addEventListener('click',()=>press(btn),{passive:true})}})).observe(document.body,{childList:true,subtree:true})}
  function finishBoot(){const sk=q('#coraBootSkeleton');if(!sk)return;requestAnimationFrame(()=>{sk.classList.add('done');setTimeout(()=>sk.remove(),reduced?0:260)})}
  function init(){ensureStyle();ensureUi();wrapFetch();enhanceImages();bindNavigation();bindAsyncButtons();if(document.readyState==='complete')setTimeout(finishBoot,80);else window.addEventListener('load',()=>setTimeout(finishBoot,80),{once:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
