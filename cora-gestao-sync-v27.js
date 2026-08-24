(function(){
  const API='https://script.google.com/macros/s/AKfycbwSpAtBgMjFyQ7J5yUxIfobEt0CxCGNgWEQZxp-mj9z-9zfWIcV2ig9iQlGzcCL5UYk/exec';
  const SEGMENTS=['Educação Infantil','Fundamental I','Fundamental II','Ensino Médio'];
  const REFRESH_MS=5000;
  let lastSignature='';
  let syncing=false;

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
  function parseMoneyPart(text,label){
    const re=new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*R\\$\\s*([0-9.,]+)','i');
    const m=txt(text).match(re);
    return m?num(m[1]):0;
  }
  async function rows(){
    const u=API+'?action=listar&aba='+encodeURIComponent('Produtos 2027')+'&_='+Date.now();
    const r=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}});
    if(!r.ok)throw new Error('Falha ao consultar valores oficiais');
    const j=await r.json();
    if(!j.ok)throw new Error(j.mensagem||'Falha ao consultar valores oficiais');
    return Array.isArray(j.rows)?j.rows:[];
  }
  function mapMaterial(product,seg,v){
    const p=product.toLowerCase();
    const series=window.CORA_DATA?.series||[];
    series.forEach(s=>{
      if(s.segmento!==seg)return;
      const n=s.nome.toLowerCase();
      let hit=false;
      if(p.includes('infantil i')&&!p.includes('ii')&&n==='infantil i')hit=true;
      else if(p.includes('infantil ii')&&n==='infantil ii')hit=true;
      else if(p.includes('infantil iii')&&n==='infantil iii')hit=true;
      else if(p.includes('infantil iv')&&n==='infantil iv')hit=true;
      else if(p.includes('infantil v')&&n==='infantil v')hit=true;
      else if((p.includes('1º ano')||p.includes('1o ano'))&&n==='1º ano')hit=true;
      else if((p.includes('2º ao 5º')||p.includes('2o ao 5o'))&&n==='2º ao 5º ano')hit=true;
      else if((p.includes('6º ao 9º')||p.includes('6o ao 9o'))&&n==='6º ao 9º ano')hit=true;
      else if((p.includes('1ª e 2ª')||p.includes('1a e 2a'))&&n==='1ª e 2ª série em')hit=true;
      else if((p.includes('3ª série')||p.includes('3a série'))&&n==='3ª série em')hit=true;
      if(hit)s.material=v;
    });
  }
  function applyUniform(seg,prod,v){
    const f=window.CORA_DATA?.fardamento||{};
    const alvo=txt(prod).toLowerCase();
    let n=0;
    const aplicar=(segmento)=>{const arr=f[segmento]||[];const u=arr.find(x=>txt(x.nome).toLowerCase()===alvo);if(u){u.valor=v;n++}};
    if(seg==='Todos')SEGMENTS.forEach(aplicar);else aplicar(seg);
    return n;
  }
  function apply(rs){
    if(!window.CORA_DATA)return 0;
    let count=0;
    rs.forEach(r=>{
      const cat=txt(r['Categoria']),seg=txt(r['Segmento/Turma']),prod=txt(r['Produto']),v27=num(r['Valor 2027']),parc=txt(r['Parcelamento']),obs=txt(r['Observação']);
      if(!v27)return;
      if(cat==='Mensalidade'&&SEGMENTS.includes(seg)){
        const m=window.CORA_DATA.mensalidades[seg]||(window.CORA_DATA.mensalidades[seg]={planoA:{parcelas:12},planoB:{parcelas:11}});
        const first=parseMoneyPart(parc,'1ª parcela');
        const a=parseMoneyPart(parc,'Plano A: 12 x');
        const b=parseMoneyPart(parc,'Plano B: 11 x');
        const late27=parseMoneyPart(obs,'Após vencimento 2027:');
        m.anuidadeAte=v27;
        m.anuidadeApos=late27||v27;
        m.primeira=first;
        m.planoA=m.planoA||{};
        m.planoB=m.planoB||{};
        m.planoA.ate=a;
        m.planoB.ate=b;
        m.planoA.apos=m.anuidadeApos&&m.primeira?(m.anuidadeApos-m.primeira)/12:0;
        m.planoB.apos=m.anuidadeApos&&m.primeira?(m.anuidadeApos-m.primeira)/11:0;
        m.planoA.parcelas=12;
        m.planoB.parcelas=11;
        count++;
        return;
      }
      if(cat==='Material Didático'){mapMaterial(prod,seg,v27);count++;return;}
      if(cat==='Fardamento'){count+=applyUniform(seg,prod,v27);}
    });
    return count;
  }
  function signature(rs){
    try{return JSON.stringify(rs.map(r=>[r['Categoria'],r['Segmento/Turma'],r['Produto'],r['Valor 2027'],r['Parcelamento'],r['Observação']]));}
    catch(e){return String(Date.now());}
  }
  function refresh(){
    try{
      if(typeof window.renderValues==='function')window.renderValues();
      if(typeof window.renderBudget==='function')window.renderBudget();
      if(typeof window.CoraFamiliaBudgetFix==='function')window.CoraFamiliaBudgetFix();
    }catch(e){}
  }
  async function sync(force=false){
    if(syncing)return 0;
    syncing=true;
    try{
      const rs=await rows();
      const sig=signature(rs);
      if(force||sig!==lastSignature){
        lastSignature=sig;
        const n=apply(rs);
        refresh();
        document.dispatchEvent(new CustomEvent('cora:official-values',{detail:{count:n,online:true,updated:true,source:'cloud'}}));
        return n;
      }
      return 0;
    }catch(e){
      console.warn('Cora Família: não foi possível atualizar os valores oficiais.',e);
      document.dispatchEvent(new CustomEvent('cora:official-values',{detail:{count:0,online:false,updated:false,source:'cloud'}}));
      return 0;
    }finally{syncing=false;}
  }
  function start(){
    sync(true);
    setInterval(()=>sync(false),REFRESH_MS);
    window.addEventListener('focus',()=>sync(true));
    window.addEventListener('online',()=>sync(true));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync(true)});
  }
  try{
    Object.keys(localStorage).filter(k=>k.startsWith('cora_familia_valores_oficiais_')).forEach(k=>localStorage.removeItem(k));
  }catch(e){}
  window.CoraFamiliaGestaoSync={sync,apply,api:API,num,refreshMs:REFRESH_MS};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();