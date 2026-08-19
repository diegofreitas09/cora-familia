(function(){
  const JSPDF_URL='https://unpkg.com/jspdf@4.2.1/dist/jspdf.umd.min.js';
  const money=n=>'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const campo=id=>String(document.getElementById(id)?.value||'').trim();
  function dataBR(v){if(!v)return'—';const p=v.split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v;}
  function idade(v){if(!v)return'';const b=new Date(v+'T12:00:00');if(isNaN(b))return'';const h=new Date();let a=h.getFullYear()-b.getFullYear();const m=h.getMonth()-b.getMonth();if(m<0||(m===0&&h.getDate()<b.getDate()))a--;return Math.max(0,a);}
  function agora(){return new Date().toLocaleString('pt-BR',{timeZone:'America/Fortaleza'});}
  function docId(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `CF-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;}
  function nomeArquivo(c){const base=(c?.s?.nome||'orcamento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();return `Cora-Familia-Orcamento-${base}-2027.pdf`;}
  function loadJsPDF(){return new Promise((resolve,reject)=>{if(window.jspdf?.jsPDF)return resolve(window.jspdf.jsPDF);const old=document.querySelector('script[data-cora-jspdf]');if(old){old.addEventListener('load',()=>resolve(window.jspdf.jsPDF),{once:true});old.addEventListener('error',reject,{once:true});return;}const s=document.createElement('script');s.dataset.coraJspdf='1';s.src=JSPDF_URL;s.onload=()=>resolve(window.jspdf.jsPDF);s.onerror=reject;document.head.appendChild(s);});}
  async function logoData(){try{const r=await fetch('logo-escola.png',{cache:'no-store'});const b=await r.blob();return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b);});}catch(e){return null}}
  async function gerar(){
    const btn=document.getElementById('downloadQuotePdf');const old=btn?.innerHTML||'';
    try{
      if(typeof window.calcBudget!=='function')throw new Error('calcBudget indisponível');
      const c=window.calcBudget();if(!c||!c.count){alert('Selecione pelo menos um item antes de baixar o orçamento.');return;}
      if(btn){btn.disabled=true;btn.textContent='Gerando PDF...';}
      const jsPDF=await loadJsPDF();const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
      const azul=[13,49,92],azul2=[15,94,168],cinza=[88,112,139],claro=[238,247,255],verde=[22,128,71];const W=210,M=16;let y=14;
      const logo=await logoData();if(logo)doc.addImage(logo,'PNG',M,y,22,22,undefined,'FAST');
      doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text('COLÉGIO CORA CORALINA',42,y+7);doc.setFontSize(20);doc.text('Cora Família',42,y+16);doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...cinza);doc.text('R. 729, 360 - Conjunto Ceará I, Fortaleza - CE',42,y+22);doc.text('Telefone: (85) 3294-0228  •  Instagram: @colegio_cora_coralina',42,y+27);
      y=47;doc.setFillColor(...azul);doc.roundedRect(M,y,W-2*M,17,3,3,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('SIMULAÇÃO DE ORÇAMENTO 2027',M+6,y+7);doc.setFontSize(8.5);doc.setFont('helvetica','normal');doc.text('Documento gerado pelo Cora Família',M+6,y+13);
      y=71;const responsavel=campo('orcResponsavel')||'—',aluno=campo('orcAluno')||'—',nasc=campo('orcNascimento'),age=idade(nasc),obs=campo('orcObservacoes'),plano=c.plano==='A'?'Plano A — 1ª + 12 parcelas':'Plano B — 1ª + 11 parcelas',cond=c.cond==='ate'?'Até o vencimento':'Após o vencimento',id=docId();
      doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('DADOS DO ORÇAMENTO',M,y);y+=6;doc.setFillColor(...claro);doc.roundedRect(M,y,W-2*M,41,2,2,'F');doc.setFontSize(9);doc.setTextColor(35,55,75);
      const linhas=[['Nº do orçamento:',id,'Data/Hora:',agora()],['Aluno:',aluno,'Responsável:',responsavel],['Nascimento:',dataBR(nasc),'Idade:',age!==''?age+' anos':'—'],['Série/Turma:',c.s?.nome||'—','Condição:',cond],['Plano:',plano,'Referência:','Valores oficiais 2027']];
      linhas.forEach((r,i)=>{const yy=y+7+i*7;doc.setFont('helvetica','bold');doc.text(r[0],M+5,yy);doc.setFont('helvetica','normal');doc.text(String(r[1]),M+33,yy,{maxWidth:57});doc.setFont('helvetica','bold');doc.text(r[2],M+96,yy);doc.setFont('helvetica','normal');doc.text(String(r[3]),M+120,yy,{maxWidth:52});});
      y+=49;
      doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('CONDIÇÕES DO PLANO',M,y);y+=5;
      doc.setFillColor(247,251,255);doc.roundedRect(M,y,W-2*M,31,2,2,'F');
      doc.setFontSize(8.5);doc.setTextColor(35,55,75);
      doc.setFont('helvetica','bold');doc.text('1ª parcela',M+6,y+7);doc.text(`${c.parcelas} parcelas seguintes`,M+63,y+7);doc.text('Anuidade',M+128,y+7);
      doc.setFontSize(12);doc.setTextColor(...verde);doc.text(money(c.primeira),M+6,y+16);doc.text(money(c.mensal),M+63,y+16);doc.text(money(c.anuidade),M+128,y+16);
      doc.setFont('helvetica','normal');doc.setFontSize(7.8);doc.setTextColor(...cinza);doc.text('Entrada / matrícula',M+6,y+24);doc.text(`${c.parcelas}x de ${money(c.mensal)}`,M+63,y+24);doc.text(cond,M+128,y+24);
      y+=39;
      doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('ITENS SELECIONADOS',M,y);y+=5;
      const itens=[];if(c.includeAnnual)itens.push(['Anuidade',1,c.anuidade,c.anuidade]);if(c.includeFirst&&!c.includeAnnual)itens.push(['1ª parcela',1,c.primeira,c.primeira]);if(c.includeMat)itens.push(['Livros / material didático',1,c.material,c.material]);(c.uniformes||[]).forEach(u=>itens.push([u.item,u.qt,u.unit,u.sub]));
      const col=[M,M+92,M+112,M+145];doc.setFillColor(...azul2);doc.rect(M,y,W-2*M,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text('Item',col[0]+3,y+5.5);doc.text('Qtd.',col[1]+3,y+5.5);doc.text('Unitário',col[2]+3,y+5.5);doc.text('Subtotal',col[3]+3,y+5.5);y+=8;doc.setFont('helvetica','normal');doc.setTextColor(35,55,75);
      itens.forEach((r,i)=>{if(i%2===0){doc.setFillColor(248,251,255);doc.rect(M,y,W-2*M,8,'F');}doc.text(String(r[0]),col[0]+3,y+5.3,{maxWidth:86});doc.text(String(r[1]),col[1]+5,y+5.3);doc.text(money(r[2]),col[2]+3,y+5.3);doc.text(money(r[3]),col[3]+3,y+5.3);y+=8;});
      y+=5;doc.setFillColor(...azul);doc.roundedRect(M+95,y,83,17,2,2,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('TOTAL ESTIMADO',M+101,y+7);doc.setFontSize(15);doc.text(money(c.total),M+174,y+12,{align:'right'});y+=25;
      if(obs){doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text('OBSERVAÇÕES',M,y);y+=5;doc.setFont('helvetica','normal');doc.setTextColor(35,55,75);doc.setFontSize(8.5);const t=doc.splitTextToSize(obs,W-2*M);doc.text(t,M,y);y+=t.length*4+6;}
      doc.setTextColor(...azul);doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text('INFORMAÇÕES IMPORTANTES',M,y);y+=5;doc.setFont('helvetica','normal');doc.setTextColor(...cinza);doc.setFontSize(8.2);const aviso='Esta é uma simulação informativa de orçamento com valores oficiais de referência de 2027. O documento não comprova pagamento e não substitui contrato, boleto, recibo ou documento fiscal.';doc.text(doc.splitTextToSize(aviso,W-2*M),M,y);
      doc.setFontSize(7.5);doc.setTextColor(130,145,160);doc.text('Gerado pelo Cora Família • '+id,M,291);doc.text('Página 1 de 1',W-M,291,{align:'right'});
      doc.save(nomeArquivo(c));
    }catch(e){console.error(e);alert('Não foi possível gerar o PDF agora.');}finally{if(btn){btn.disabled=false;btn.innerHTML=old;}}
  }
  function instalar(){const b=document.getElementById('downloadQuotePdf');if(!b)return;b.onclick=gerar;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,50));else setTimeout(instalar,50);
  new MutationObserver(instalar).observe(document.body,{childList:true,subtree:true});
})();