(function(){
  const STORAGE_KEY='coraFamiliaAcessoV1';
  const DURACAO=30*24*60*60*1000;
  const endpoint=(window.CORA_CONFIG&&CORA_CONFIG.feedbackEndpoint)||'';

  function sessaoValida(){
    try{
      const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      return !!(s&&s.expiresAt>Date.now());
    }catch(e){return false;}
  }

  function salvarSessao(dados){
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      aluno:dados.aluno||'',
      serie:dados.serie||'',
      responsavel:dados.responsavel||'',
      expiresAt:Date.now()+DURACAO
    }));
  }

  function sair(){
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function adicionarBotaoSair(){
    const area=document.querySelector('.header-actions');
    if(!area||document.getElementById('logoutCora'))return;
    const b=document.createElement('button');
    b.id='logoutCora';
    b.className='round';
    b.type='button';
    b.title='Sair';
    b.setAttribute('aria-label','Sair');
    b.textContent='↪';
    b.onclick=()=>{if(confirm('Deseja sair do Cora Família?'))sair();};
    area.prepend(b);
  }

  function jsonp(params){
    return new Promise((resolve,reject)=>{
      if(!endpoint){reject(new Error('Endpoint não configurado'));return;}
      const cb='coraCb_'+Date.now()+'_'+Math.floor(Math.random()*100000);
      const script=document.createElement('script');
      const timer=setTimeout(()=>{cleanup();reject(new Error('Tempo esgotado'));},15000);
      function cleanup(){clearTimeout(timer);delete window[cb];script.remove();}
      window[cb]=(data)=>{cleanup();resolve(data);};
      const qs=new URLSearchParams({...params,callback:cb});
      script.src=endpoint+'?'+qs.toString();
      script.onerror=()=>{cleanup();reject(new Error('Falha na conexão'));};
      document.head.appendChild(script);
    });
  }

  function criarGate(){
    if(document.getElementById('coraAccessGate'))return;
    const style=document.createElement('style');
    style.textContent=`
      #coraAccessGate{position:fixed;inset:0;z-index:99999;background:linear-gradient(145deg,#eef7ff,#dceeff);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif}
      #coraAccessGate .access-card{width:min(440px,100%);background:#fff;border-radius:24px;padding:26px;box-shadow:0 20px 55px rgba(13,49,92,.18)}
      #coraAccessGate .access-logo{display:flex;align-items:center;gap:14px;margin-bottom:16px}
      #coraAccessGate .access-logo img{width:64px;height:64px;object-fit:contain}
      #coraAccessGate h2{margin:0;color:#0d315c;font-size:24px}
      #coraAccessGate p{color:#58708b;line-height:1.45}
      #coraAccessGate label{display:block;font-weight:800;color:#173a63;margin:13px 0 6px}
      #coraAccessGate input,#coraAccessGate select{width:100%;box-sizing:border-box;border:1px solid #bfd1e5;border-radius:12px;padding:12px 13px;font-size:15px;background:#fff}
      #coraAccessGate button{width:100%;margin-top:18px;border:0;border-radius:13px;padding:13px;background:#0f5ea8;color:#fff;font-weight:800;font-size:16px;cursor:pointer}
      #coraAccessGate button:disabled{opacity:.65;cursor:wait}
      #coraAccessStatus{min-height:22px;margin-top:12px;font-size:14px;font-weight:700}
      #coraAccessGate .nota{font-size:12px;color:#72869c;margin-top:12px}
    `;
    document.head.appendChild(style);

    const gate=document.createElement('div');
    gate.id='coraAccessGate';
    gate.innerHTML=`<div class="access-card">
      <div class="access-logo"><img src="logo-escola.png" alt="Colégio Cora Coralina"><div><small style="font-weight:800;color:#0f5ea8">COLÉGIO CORA CORALINA</small><h2>Cora Família</h2></div></div>
      <p><b>Acesso exclusivo às famílias.</b><br>Informe os dados do aluno para continuar.</p>
      <label for="acMatricula">Número da matrícula</label>
      <input id="acMatricula" inputmode="numeric" autocomplete="off" placeholder="Ex.: 2026045">
      <label for="acNome">Nome completo do aluno</label>
      <input id="acNome" autocomplete="off" placeholder="Nome completo">
      <label for="acSerie">Série / turma</label>
      <select id="acSerie">
        <option value="">Selecione</option>
        <option>Infantil I - Manhã</option><option>Infantil II - Manhã</option><option>Infantil III - Manhã</option><option>Infantil IV - Manhã</option><option>Infantil V - Manhã</option>
        <option>1º Ano - Manhã</option><option>1º Ano - Tarde</option><option>2º Ano - Manhã</option><option>2º Ano - Tarde</option><option>3º Ano - Manhã</option><option>3º Ano - Tarde</option>
        <option>4º Ano - Manhã</option><option>5º Ano - Manhã</option><option>6º Ano - Manhã</option><option>7º Ano - Manhã</option><option>8º Ano - Manhã</option><option>9º Ano - Manhã</option>
        <option>1ª Série - Manhã</option><option>2ª Série - Manhã</option><option>3ª Série - Manhã</option>
      </select>
      <button id="acEntrar" type="button">Entrar no Cora Família</button>
      <div id="coraAccessStatus"></div>
      <div class="nota">Para facilitar o acesso, o sistema libera a entrada quando pelo menos 2 das 3 informações conferem com o cadastro da escola e o aluno está ativo.</div>
    </div>`;
    document.body.appendChild(gate);

    const btn=document.getElementById('acEntrar');
    btn.onclick=async()=>{
      const matricula=document.getElementById('acMatricula').value.trim();
      const nome=document.getElementById('acNome').value.trim();
      const serie=document.getElementById('acSerie').value;
      const status=document.getElementById('coraAccessStatus');
      if(!matricula||!nome||!serie){status.style.color='#b42318';status.textContent='Preencha os três campos para validar.';return;}
      btn.disabled=true;status.style.color='#0f5ea8';status.textContent='Validando cadastro...';
      try{
        const r=await jsonp({action:'validarAcesso',matricula,nome,serie});
        if(r&&r.autorizado){
          salvarSessao(r);
          status.style.color='#16803a';status.textContent='✅ Acesso autorizado. Entrando...';
          setTimeout(()=>{gate.remove();adicionarBotaoSair();},450);
        }else{
          status.style.color='#b42318';status.textContent=(r&&r.mensagem)||'Não foi possível liberar o acesso.';
        }
      }catch(e){status.style.color='#b42318';status.textContent='Não foi possível consultar a escola agora. Tente novamente.';}
      finally{btn.disabled=false;}
    };
  }

  function iniciar(){
    if(sessaoValida())adicionarBotaoSair();
    else criarGate();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);
  else iniciar();
})();
