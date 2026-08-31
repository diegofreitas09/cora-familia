(function(){'use strict';if(window.__CORA_MATERIAL_SYNC_FIX_V56__)return;window.__CORA_MATERIAL_SYNC_FIX_V56__=true;
const API=window.CORA_CONFIG?.syncEndpoint||'https://script.google.com/macros/s/AKfycbwSpAtBgMjFyQ7J5yUxIfobEt0CxCGNgWEQZxp-mj9z-9zfWIcV2ig9iQlGzcCL5UYk/exec';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/º/g,'o').replace(/ª/g,'a').replace(/\s+/g,' ').trim();
const num=v=>{if(typeof v==='number')return v;let s=String(v??'').replace(/R\$/gi,'').replace(/\s/g,'');if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else if(s.includes(','))s=s.replace(',','.');return Number(s)||0};
const pick=(r,names)=>{for(const n of names)if(r&&r[n]!==undefined&&String(r[n]).trim()!=='')return r[n];const m={};Object.keys(r||{}).forEach(k=>m[norm(k)]=r[k]);for(const n of names)if(m[norm(n)]!==undefined&&String(m[norm(n)]).trim()!=='')return m[norm(n)];return''};
const aliases={
'infantil i':['infantil i'],
'infantil ii':['infantil ii'],
'infantil iii':['infantil iii'],
'infantil iv':['infantil iv'],
'infantil v':['infantil v'],
'1o ano':['1o ano','1 ano'],
'2o ao 5o ano':['2o ao 5o ano','2 ao 5 ano','2o ao 5o'],
'6o ao 9o ano':['6o ao 9o ano','6 ao 9 ano','6o ao 9o'],
'1a e 2a serie em':['1a e 2a serie em','1a e 2a serie','1 e 2 serie em'],
'3a serie em':['3a serie em','3a serie','3 serie em']};
function targetFromRow(r){const hay=norm([pick(r,['Produto']),pick(r,['Descrição','Descricao']),pick(r,['Segmento/Turma','Turma','Segmento'])].join(' | '));for(const [target,list] of Object.entries(aliases)){if(list.some(a=>new RegExp('(^|[^a-z0-9])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)','i').test(hay)))return target}return''}
function authorized(r){const s=norm(pick(r,['Status'])),p=norm(pick(r,['Publicado no Cora Família','Publicado no Cora Familia','Publicado']));return (!s||['aprovado','autorizado','publicado','ativo','sim','ok'].includes(s))&&(!p||['sim','s','true','1','publicado','ativo','ok'].includes(p))}
async function run(){try{const res=await fetch(API+'?action=listar&aba='+encodeURIComponent('Produtos 2027')+'&_='+Date.now(),{cache:'no-store'});const j=await res.json();if(!j.ok||!Array.isArray(j.rows))return 0;const latest=new Map();j.rows.forEach((r,i)=>{if(!authorized(r))return;const cat=norm(pick(r,['Categoria']));if(!cat.includes('material'))return;const target=targetFromRow(r);const v=num(pick(r,['Valor 2027','Valor']));if(!target||!v)return;latest.set(target,{v,i})});let n=0;(window.CORA_DATA?.series||[]).forEach(s=>{const key=norm(s.nome);const rec=latest.get(key);if(rec){s.material=rec.v;n++}});try{window.renderValues?.();window.renderBudget?.();window.CoraFamiliaBudgetFix?.()}catch(e){}if(window.CORA_DATA?.meta){window.CORA_DATA.meta.materialSyncV56=n;window.CORA_DATA.meta.materialSyncV56Em=new Date().toISOString()}return n}catch(e){console.warn('Cora Família v56: falha ao corrigir materiais',e);return 0}}
function start(){run();setInterval(run,15000);window.addEventListener('focus',run);document.addEventListener('visibilitychange',()=>{if(!document.hidden)run()})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,500));else setTimeout(start,500);window.CoraMaterialSyncFixV56={run,version:'56'};})();