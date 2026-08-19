(function(){
  const q=id=>document.getElementById(id);
  const safe=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=n=>'R$ '+safe(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  function serie(){return (window.CORA_DATA?.series||[]).find(s=>s.id===q('serieSel')?.value)||window.CORA_DATA?.series?.[0]}
  function calc(){
    const s=serie(); if(!s)return null;
    const m=window.CORA_DATA?.mensalidades?.[s.segmento]; if(!m)return null;
    const plano=q('planoSel')?.value||'A',cond=q('condSel')?.value||'ate',p=plano==='A'?m.planoA:m.planoB;
    const annual=!!q('anuidadeCheck')?.checked,firstOn=!!q('primeiraCheck')?.checked,matOn=!!q('materialCheck')?.checked;
    const anuidade=cond==='ate'?safe(m.anuidadeAte):safe(m.anuidadeApos),first=safe(m.primeira),material=safe(s.material);
    let mensalTotal=0,count=0,lines=[];
    if(annual){mensalTotal+=anuidade;count++;lines.push(`Anuidade — ${money(anuidade)}`)}
    else if(firstOn){mensalTotal+=first;count++;lines.push(`1ª parcela — ${money(first)}`)}
    if(matOn){count++;lines.push(`Livros / material didático — ${money(material)}`)}
    let uniformTotal=0,uniformCount=0;
    document.querySelectorAll('#uniformList .uniform-item').forEach(row=>{
      const qt=safe(row.querySelector('.qty b')?.textContent); if(qt<=0)return;
      const name=row.querySelector('div > b')?.textContent||'Fardamento';
      const txt=row.querySelector('small')?.textContent||'';
      const unit=Number(txt.replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.'))||0;
      const sub=qt*unit;uniformTotal+=sub;uniformCount+=qt;lines.push(`${name} × ${qt} — ${money(sub)}`)
    });
    const matTotal=matOn?material:0,total=mensalTotal+matTotal+uniformTotal;
    return{mensalTotal,matTotal,uniformTotal,total,count:count+uniformCount,lines,first,anuidade,material,p};
  }
  function apply(){const c=calc();if(!c)return;
    if(q('selectedItemsList'))q('selectedItemsList').innerHTML=c.lines.length?c.lines.map(x=>`<div class="selected-item">${x}</div>`).join(''):'<small>Nenhum item selecionado.</small>';
    if(q('sumMens'))q('sumMens').textContent=money(c.mensalTotal);
    if(q('sumMat'))q('sumMat').textContent=money(c.matTotal);
    if(q('sumFarda'))q('sumFarda').textContent=money(c.uniformTotal);
    if(q('sumTotal'))q('sumTotal').textContent=money(c.total);
    if(q('cartBadge'))q('cartBadge').textContent=c.count;
    if(q('cartNavCount'))q('cartNavCount').textContent=c.count;
    if(q('cartCountText'))q('cartCountText').textContent=`${c.count} ${c.count===1?'item selecionado':'itens selecionados'}`;
  }
  document.addEventListener('change',e=>{if(['serieSel','planoSel','condSel','anuidadeCheck','primeiraCheck','materialCheck'].includes(e.target?.id))setTimeout(apply,0)},true);
  document.addEventListener('click',e=>{if(e.target.closest?.('.qtyBtn'))setTimeout(apply,0)},true);
  document.addEventListener('cora:official-values',()=>setTimeout(apply,0));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,250));else setTimeout(apply,250);
  window.CoraFamiliaBudgetFix=apply;
})();