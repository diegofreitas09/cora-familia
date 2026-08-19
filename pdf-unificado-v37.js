(function(){
  const JSPDF_URL='https://unpkg.com/jspdf@4.2.1/dist/jspdf.umd.min.js';
  const q=id=>document.getElementById(id);
  const moeda=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  function campo(id){return String(q(id)?.value||'').trim()}
  function idade(v){if(!v)return'';const b=new Date(v+'T12:00:00'),h=new Date();if(isNaN(b))return'';let a=h.getFullYear()-b.getFullYear(),m=h.getMonth()-b.getMonth();if(m<0||(m===0&&h.getDate()<b.getDate()))a--;return Math.max(0,a)}
  function dataBR(v){if(!v)return'—';const p=v.split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v}
  function agora(){return new Date().toLocaleString('pt-BR',{timeZone:'America/Fortaleza'})}
  function docId(){const d=new Date(),p=n=>String(n).padStart(2,'0');return 'CF-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())}
  function nomeArquivo(c){const b=(c?.s?.nome||'orcamento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();return `Cora-Familia-Orcamento-${b}-2027.pdf`}
  function loadJsPDF(){return new Promise((resolve,reject)=>{if(window.jspdf?.jsPDF)return resolve(window.jspdf.jsPDF);let s=document.querySelector('script[data-cora-jspdf]');if(s){s.addEventListener('load',()=>resolve(window.jspdf.jsPDF),{once:true});s.addEventListener('error',reject,{once:true});return} s=document.createElement('script');s.src=JSPDF_URL;s.async=true;s.dataset.coraJspdf='1';s.onload=()=>resolve(window.jspdf.jsPDF);s.onerror=reject;document.head.appendChild(s)})}
  async function img(src){const r=await fetch(src,{cache:'no-store'});if(!r.ok)throw 0;const b=await r.blob();return await new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>ok(fr.result);fr.onerror=no;fr.readAsDataURL(b)})}
  async function gerar(opts={}){
    if(typeof window.calcBudget!=='function')throw new Error('Orçamento indisponível');
    const c=window.calcBudget();if(!c||c.count===0)throw new Error('Selecione pelo menos um item.');
    const jsPDF=await loadJsPDF(),doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    const azul=[13,49,92],azul2=[15,94,168],cinza=[88,112,139],claro=[238,247,255],L=210,M=16;let y=15;
    try{doc.addImage(await img('logo-escola.png'),'PNG',M,y,22,22,undefined,'FAST')}catch(e){}
    const escola=window.CORA_CONFIG?.escola||{};
    doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text('COLÉGIO CORA CORALINA',42,y+7);doc.setFontSize(20);doc.text('Cora Família',42,y+16);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...cinza);doc.text(escola.endereco||'R. 729, 360 - Conjunto Ceará I, Fortaleza - CE',42,y+22);doc.text('Telefone: '+(escola.telefoneExibicao||'(85) 3294-0228')+'  •  Instagram: @'+String(escola.instagram||'colegio_cora_coralina').replace(/^@/,''),42,y+27);
    y=48;doc.setFillColor(...azul);doc.roundedRect(M,y,L-2*M,17,3,3,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('SIMULAÇÃO DE ORÇAMENTO 2027',M+6,y+7);doc.setFontSize(8.5);doc.setFont('helvetica','normal');doc.text('Documento gerado pelo Cora Família',M+6,y+13);
    const responsavel=campo('orcResponsavel')||'—',aluno=campo('orcAluno')||'—',nasc=campo('orcNascimento'),obs=campo('orcObservacoes');
    const plano=c.plano==='A'?'Plano A — 1ª + 12 parcelas':'Plano B — 1ª + 11 parcelas',cond=c.cond==='ate'?'Até o vencimento':'Após o vencimento',id=opts.id||docId(),dataHora=opts.dataHora||agora();
    y=72;doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('DADOS DO ORÇAMENTO',M,y);y+=6;doc.setFillColor(...claro);doc.roundedRect(M,y,L-2*M,41,2,2,'F');doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(35,55,75);
    const linhas=[['Nº do orçamento:',id,'Data/Hora:',dataHora],['Aluno:',aluno,'Responsável:',responsavel],['Nascimento:',dataBR(nasc),'Idade:',idade(nasc)!==''?idade(nasc)+' anos':'—'],['Série/Turma:',c.s.nome||'—','Condição:',cond],['Plano:',plano,'Referência:','Valores oficiais 2027']];
    linhas.forEach((r,i)=>{const yy=y+7+i*7;doc.setFont('helvetica','bold');doc.text(r[0],M+5,yy);doc.setFont('helvetica','normal');doc.text(String(r[1]),M+33,yy,{maxWidth:57});doc.setFont('helvetica','bold');doc.text(r[2],M+96,yy);doc.setFont('helvetica','normal');doc.text(String(r[3]),M+120,yy,{maxWidth:52})});
    y+=49;doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('CONDIÇÕES DO PLANO',M,y);y+=5;doc.setFillColor(245,249,253);doc.roundedRect(M,y,L-2*M,25,2,2,'F');doc.setTextColor(35,55,75);doc.setFontSize(9);
    doc.setFont('helvetica','bold');doc.text('1ª parcela',M+6,y+7);doc.text('Parcelas seguintes',M+66,y+7);doc.text('Anuidade',M+132,y+7);
    doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text(moeda(c.primeira),M+6,y+16);doc.text(`${c.parcelas} × ${moeda(c.mensal)}`,M+66,y+16);doc.text(moeda(c.anuidade),M+132,y+16);
    y+=33;doc.setFont('helvetica','bold');doc.setTextColor(...azul);doc.setFontSize(10);doc.text('ITENS SELECIONADOS',M,y);y+=5;
    const itens=[];if(c.includeAnnual)itens.push(['Anuidade',1,c.anuidade,c.anuidade]);if(c.includeFirst&&!c.includeAnnual)itens.push(['1ª parcela',1,c.primeira,c.primeira]);if(c.includeMat)itens.push(['Livros / material didático',1,c.material,c.material]);c.uniformes.forEach(u=>itens.push([u.item,u.qt,u.unit,u.sub]));
    const col=[M,M+92,M+112,M+145];doc.setFillColor(...azul2);doc.rect(M,y,L-2*M,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text('Item',col[0]+3,y+5.5);doc.text('Qtd.',col[1]+3,y+5.5);doc.text('Unitário',col[2]+3,y+5.5);doc.text('Subtotal',col[3]+3,y+5.5);y+=8;doc.setFont('helvetica','normal');doc.setTextColor(35,55,75);
    itens.forEach((r,i)=>{if(y>245){doc.addPage();y=18}if(i%2===0){doc.setFillColor(248,251,255);doc.rect(M,y,L-2*M,8,'F')}doc.text(String(r[0]),col[0]+3,y+5.3,{maxWidth:86});doc.text(String(r[1]),col[1]+5,y+5.3);doc.text(moeda(r[2]),col[2]+3,y+5.3);doc.text(moeda(r[3]),col[3]+3,y+5.3);y+=8});
    y+=5;if(y>238){doc.addPage();y=18}doc.setFillColor(...azul);doc.roundedRect(M+95,y,83,17,2,2,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('TOTAL ESTIMADO',M+101,y+7);doc.setFontSize(15);doc.text(moeda(c.total),M+174,y+12,{align:'right'});y+=26;
    if(obs){doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text('OBSERVAÇÕES',M,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(35,55,75);const t=doc.splitTextToSize(obs,L-2*M);doc.text(t,M,y);y+=t.length*4+7}
    doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text('INFORMAÇÕES IMPORTANTES',M,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(8.1);doc.setTextColor(...cinza);const aviso='Esta é uma simulação informativa com valores oficiais de referência de 2027. Não comprova pagamento e não substitui contrato, boleto, recibo ou documento fiscal.';const t=doc.splitTextToSize(aviso,L-2*M);doc.text(t,M,y);
    const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(7.5);doc.setTextColor(130,145,160);doc.text('Gerado pelo Cora Família • '+id,M,291);doc.text('Página '+i+' de '+pages,L-M,291,{align:'right'})}
    const filename=opts.filename||nomeArquivo(c);
    if(opts.download!==false)doc.save(filename);
    const blob=doc.output('blob');
    const base64=await new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>ok(String(fr.result).split(',')[1]);fr.onerror=no;fr.readAsDataURL(blob)});
    return {blob,base64,filename,id,c};
  }
  async function baixar(){const b=q('downloadQuotePdf'),old=b?.innerHTML||'';try{if(b){b.disabled=true;b.textContent='Gerando PDF...'}await gerar({download:true})}catch(e){alert(e.message||'Não foi possível gerar o PDF.')}finally{if(b){b.disabled=false;b.innerHTML=old}}}
  function bind(){const b=q('downloadQuotePdf');if(b)b.onclick=baixar}
  window.CoraPdfV37={gerar};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,30));else setTimeout(bind,30);
  new MutationObserver(()=>bind()).observe(document.documentElement,{childList:true,subtree:true});
})();