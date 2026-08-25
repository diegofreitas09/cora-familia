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
  const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const round2=v=>Math.round((Number(v)||0)*100)/100;
  const pick=(row,names)=>{
    for(const name of names){
      if(Object.prototype.hasOwnProperty.call(row,name)&&txt(row[name]))return row[name];
    }
    const normalized=Object.keys(row||{}).reduce((acc,k)=>{acc[norm(k)]=row[k];return acc;},{});
    for(const name of names){const v=normalized[norm(name)];if(txt(v))return v;}
    return '';
  };
  function parseMoneyPart(text,label){
    const re=new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*R\\$?\\s*([0-9.,]+)','i');
    const m=txt(text).match(re);
    return m?num(m[1]):0;
  }
  function parseAnyMoneyPart(text,labels){
    for(const label of labels){const v=parseMoneyPart(text,label);if(v>0)return v;}
    return 0;
  }
  async function rows(){
    const u=API+'?action=listar&aba='+encodeURIComponent('Produtos 2027')+'&_='+Date.now();
    const r=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}});
    if(!r.ok)throw new Error('Falha ao consultar valores oficiais');
    const j=await r.json();
    if(!j.ok)throw new Error(j.mensagem||'Falha ao consultar valores oficiais');
    if(!Array.isArray(j.rows))throw new Error('Resposta do Gestão sem lista de produtos');
    return j.rows;
  }
  function mapMaterial(product,seg,v){
    const p=norm(product);
    const series=window.CORA_DATA?.series||[];
    let hits=0;
    series.forEach(s=>{
      if(norm(s.segmento)!==norm(seg))return;
      const n=norm(s.nome);
      let hit=false;
      if(p.includes('infantil i')&&!p.includes('infantil ii')&&n==='infantil i')hit=true;
      else if(p.includes('infantil ii')&&!p.includes('infantil iii')&&n==='infantil ii')hit=true;
      else if(p.includes('infantil iii')&&n==='infantil iii')hit=true;
      else if(p.includes('infantil iv')&&n==='infantil iv')hit=true;
      else if(p.includes('infantil v')&&n==='infantil v')hit=true;
      else if((p.includes('1º ano')||p.includes('1o ano')||p.includes('1 ano'))&&n==='1º ano')hit=true;
      else if((p.includes('2º ao 5º')||p.includes('2o ao 5o')||p.includes('2 ao 5'))&&n==='2º ao 5º ano')hit=true;
      else if((p.includes('6º ao 9º')||p.includes('6o ao 9o')||p.includes('6 ao 9'))&&n==='6º ao 9º ano')hit=true;
      else if((p.includes('1ª e 2ª')||p.includes('1a e 2a')||p.includes('1 e 2'))&&n==='1ª e 2ª serie em')hit=true;
      else if((p.includes('3ª serie')||p.includes('3a serie')||p.includes('3 serie'))&&n==='3ª serie em')hit=true;
      if(hit){s.material=v;hits++;}
    });
    return hits;
  }
  function applyUniform(seg,prod,v){
    const f=window.CORA_DATA?.fardamento||{};
    const alvo=norm(prod);
    let n=0;
    const aplicar=(segmento)=>{
      const arr=f[segmento]||[];
      const u=arr.find(x=>norm(x.nome)===alvo);
      if(u){u.valor=v;n++;}
    };
    if(norm(seg)==='todos')SEGMENTS.forEach(aplicar);else{
      const key=SEGMENTS.find(x=>norm(x)===norm(seg))||seg;
      aplicar(key);
    }
    return n;
  }
  function applySti(seg,prod,v){
    const sti=window.CORA_DATA?.sti||{};
    const alvo=norm(prod);
    let n=0;
    Object.keys(sti).forEach(key=>{
      if(seg&&norm(seg)!=='todos'&&norm(seg)!==norm(key)&&!(norm(seg)==='fundamental'&&norm(key)==='fundamental'))return;
      const u=(sti[key]||[]).find(x=>norm(x.nome)===alvo);
      if(u){u.valor=v;n++;}
    });
    return n;
  }
  function apply(rs){
    if(!window.CORA_DATA)return 0;
    let count=0;
    rs.forEach(r=>{
      const cat=txt(pick(r,['Categoria']));
      const seg=txt(pick(r,['Segmento/Turma','Segmento','Turma']));
      const prod=txt(pick(r,['Produto','Item','Descrição','Descricao']));
      const v27=num(pick(r,['Valor 2027','2027','Valor']));
      const parc=txt(pick(r,['Parcelamento','Condição de pagamento','Condicao de pagamento']));
      const obs=txt(pick(r,['Observação','Observacao','Obs']));
      const catN=norm(cat);
      if(!v27)return;

      const segmentKey=SEGMENTS.find(x=>norm(x)===norm(seg));
      if(catN.includes('mensal')&&segmentKey){
        const m=window.CORA_DATA.mensalidades[segmentKey]||(window.CORA_DATA.mensalidades[segmentKey]={planoA:{parcelas:12},planoB:{parcelas:11}});
        const first=parseAnyMoneyPart(parc,['1ª parcela','1a parcela','entrada']);
        const a=parseAnyMoneyPart(parc,['Plano A: 12 x','Plano A 12 x','Plano A — 12 x']);
        const b=parseAnyMoneyPart(parc,['Plano B: 11 x','Plano B 11 x','Plano B — 11 x']);
        const late27=parseAnyMoneyPart(obs,['Após vencimento 2027:','Apos vencimento 2027:','2027 após vencimento:','2027 apos vencimento:']);

        m.anuidadeAte=v27;
        if(late27>0)m.anuidadeApos=late27;
        if(first>0)m.primeira=first;
        m.planoA=m.planoA||{};
        m.planoB=m.planoB||{};
        if(a>0)m.planoA.ate=a;
        if(b>0)m.planoB.ate=b;
        m.planoA.parcelas=12;
        m.planoB.parcelas=11;
        if(m.anuidadeApos>0&&m.primeira>0){
          m.planoA.apos=round2((m.anuidadeApos-m.primeira)/12);
          m.planoB.apos=round2((m.anuidadeApos-m.primeira)/11);
        }
        count++;
        return;
      }
      if(catN.includes('material')){count+=mapMaterial(prod,seg,v27);return;}
      if(catN.includes('fardamento')){count+=applyUniform(seg,prod,v27);return;}
      if(catN.includes('sti')||catN.includes('tempo integral')){count+=applySti(seg,prod,v27);}
    });
    window.CORA_DATA.meta=window.CORA_DATA.meta||{};
    window.CORA_DATA.meta.ultimaSincronizacaoAplicada=new Date().toISOString();
    window.CORA_DATA.meta.registrosAplicados=count;
    return count;
  }
  function signature(rs){
    try{return JSON.stringify(rs.map(r=>[
      pick(r,['Categoria']),pick(r,['Segmento/Turma','Segmento','Turma']),pick(r,['Produto','Item','Descrição','Descricao']),
      pick(r,['Valor 2027','2027','Valor']),pick(r,['Parcelamento']),pick(r,['Observação','Observacao','Obs'])
    ]));}
    catch(e){return String(Date.now());}
  }
  function refresh(){
    try{
      if(typeof window.renderValues==='function')window.renderValues();
      if(typeof window.renderBudget==='function')window.renderBudget();
      if(typeof window.CoraFamiliaBudgetFix==='function')window.CoraFamiliaBudgetFix();
    }catch(e){console.warn('Cora Família: falha ao redesenhar valores.',e);}
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
      console.warn('Cora Família: não foi possível atualizar os valores oficiais; mantendo o fechamento local oficial.',e);
      document.dispatchEvent(new CustomEvent('cora:official-values',{detail:{count:0,online:false,updated:false,source:'fallback-oficial'}}));
      return 0;
    }finally{syncing=false;}
  }
  function start(){
    sync(true);
    setInterval(()=>sync(false),REFRESH_MS);
    window.addEventListener('focus',()=>sync(true));
    window.addEventListener('online',()=>sync(true));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync(true);});
  }
  try{
    Object.keys(localStorage).filter(k=>k.startsWith('cora_familia_valores_oficiais_')).forEach(k=>localStorage.removeItem(k));
  }catch(e){}
  window.CoraFamiliaGestaoSync={sync,apply,api:API,num,refreshMs:REFRESH_MS};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();