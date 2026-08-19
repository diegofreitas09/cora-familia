(function(){
  const API='https://script.google.com/macros/s/AKfycbwSpAtBgMjFyQ7J5yUxIfobEt0CxCGNgWEQZxp-mj9z-9zfWIcV2ig9iQlGzcCL5UYk/exec';
  const CACHE='cora_familia_valores_oficiais_v28';
  const SEGMENTS=['Educação Infantil','Fundamental I','Fundamental II','Ensino Médio'];
  function num(v){
    if(typeof v==='number') return Number.isFinite(v)?v:0;
    let s=String(v??'').trim().replace(/R\$/gi,'').replace(/\s/g,'');
    if(!s)return 0;
    if(s.includes(',')&&s.includes('.')) s=s.replace(/\./g,'').replace(',','.');
    else if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.');
    else if(/^[-+]?\d+\.\d{1,2}$/.test(s)) return Number(s)||0;
    else if(/^[-+]?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
    return Number(s)||0;
  }
  const txt=v=>String(v??'').trim();
  function parseMoneyPart(text,label){const re=new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*R\\$\\s*([0-9.,]+)','i');const m=txt(text).match(re);return m?num(m[1]):0}
  async function rows(){const u=API+'?action=listar&aba='+encodeURIComponent('Produtos 2027')+'&_='+Date.now();const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error('Falha ao consultar valores oficiais');const j=await r.json();if(!j.ok)throw new Error(j.mensagem||'Falha ao consultar valores oficiais');return Array.isArray(j.rows)?j.rows:[]}
  function mapMaterial(product,seg,v){const p=product.toLowerCase();const series=window.CORA_DATA?.series||[];series.forEach(s=>{if(s.segmento!==seg)return;const n=s.nome.toLowerCase();let hit=false;if(p.includes('infantil i')&&!p.includes('ii')&&n==='infantil i')hit=true;else if(p.includes('infantil ii')&&n==='infantil ii')hit=true;else if(p.includes('infantil iii')&&n==='infantil iii')hit=true;else if(p.includes('infantil iv')&&n==='infantil iv')hit=true;else if(p.includes('infantil v')&&n==='infantil v')hit=true;else if((p.includes('1º ano')||p.includes('1o ano'))&&n==='1º ano')hit=true;else if((p.includes('2º ao 5º')||p.includes('2o ao 5o'))&&n==='2º ao 5º ano')hit=true;else if((p.includes('6º ao 9º')||p.includes('6o ao 9o'))&&n==='6º ao 9º ano')hit=true;else if((p.includes('1ª e 2ª')||p.includes('1a e 2a'))&&n==='1ª e 2ª série em')hit=true;else if((p.includes('3ª série')||p.includes('3a série'))&&n==='3ª série em')hit=true;if(hit)s.material=v})}
  function apply(rows){if(!window.CORA_DATA)return 0;let count=0;rows.forEach(r=>{const cat=txt(r['Categoria']),seg=txt(r['Segmento/Turma']),prod=txt(r['Produto']),v27=num(r['Valor 2027']),parc=txt(r['Parcelamento']),obs=txt(r['Observação']);if(!v27)return;if(cat==='Mensalidade'&&SEGMENTS.includes(seg)){const m=window.CORA_DATA.mensalidades[seg]||(window.CORA_DATA.mensalidades[seg]={planoA:{parcelas:12},planoB:{parcelas:11}});const first=parseMoneyPart(parc,'1ª parcela');const a=parseMoneyPart(parc,'Plano A: 12 x');const b=parseMoneyPart(parc,'Plano B: 11 x');const late27=parseMoneyPart(obs,'Após vencimento 2027:');m.anuidadeAte=v27;m.anuidadeApos=late27||m.anuidadeApos||v27;m.primeira=first||m.primeira||0;m.planoA=m.planoA||{};m.planoB=m.planoB||{};m.planoA.ate=a||m.planoA.ate||0;m.planoB.ate=b||m.planoB.ate||0;m.planoA.apos=m.anuidadeApos&&m.primeira?(m.anuidadeApos-m.primeira)/12:(m.planoA.apos||0);m.planoB.apos=m.anuidadeApos&&m.primeira?(m.anuidadeApos-m.primeira)/11:(m.planoB.apos||0);m.planoA.parcelas=12;m.planoB.parcelas=11;count++;return}if(cat==='Material Didático'){mapMaterial(prod,seg,v27);count++;return}if(cat==='Fardamento'){const arr=window.CORA_DATA.fardamento?.[seg]||[];const u=arr.find(x=>txt(x.nome).toLowerCase()===prod.toLowerCase());if(u){u.valor=v27;count++}}});try{localStorage.setItem(CACHE,JSON.stringify({at:new Date().toISOString(),data:window.CORA_DATA}))}catch(e){}return count}
  function useCache(){try{const c=JSON.parse(localStorage.getItem(CACHE)||'null');if(!c?.data)return 0;window.CORA_DATA=c.data;return 1}catch(e){return 0}}
  function refresh(){try{if(typeof window.renderValues==='function')window.renderValues();if(typeof window.renderBudget==='function')window.renderBudget()}catch(e){} }
  async function sync(){try{const rs=await rows();const n=apply(rs);refresh();document.dispatchEvent(new CustomEvent('cora:official-values',{detail:{count:n,online:true}}));return n}catch(e){console.warn('Cora Família: usando últimos valores disponíveis.',e);useCache();refresh();document.dispatchEvent(new CustomEvent('cora:official-values',{detail:{count:0,online:false}}));return 0}}
  try{localStorage.removeItem('cora_familia_valores_oficiais_v27')}catch(e){}
  window.CoraFamiliaGestaoSync={sync,apply,useCache,api:API,num};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{useCache();refresh();setTimeout(sync,120)});else{useCache();refresh();setTimeout(sync,120)}
})();