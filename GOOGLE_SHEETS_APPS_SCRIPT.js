// ============================================================
// CORA FAMÍLIA — BACKEND GOOGLE APPS SCRIPT
// Famílias: quaisquer 2 de 3 campos + chave de funcionário
// ============================================================

function normalizarTexto_(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase();
}

function normalizarSerie_(valor) {
  return normalizarTexto_(valor).replace(/\b(MANHA|TARDE|NOITE)\b/g,'').replace(/\bTURMA\s*:?\s*\d+\b/g,'').replace(/[-–—]/g,' ').replace(/\s+/g,' ').trim();
}

function respostaJson_(obj, callback) {
  const texto = JSON.stringify(obj);
  if (callback) return ContentService.createTextOutput(callback+'('+texto+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.JSON);
}

function safeTextForSheet_(value, maxLength) {
  let text = String(value == null ? '' : value).trim();
  if (maxLength && text.length > maxLength) text = text.slice(0, maxLength);
  return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
}

function doGet(e) {
  try {
    const p=(e&&e.parameter)||{};
    const callback=p.callback||'';
    const ss=SpreadsheetApp.getActiveSpreadsheet();

    if (p.action==='validarChaveFuncionario') {
      const chave=String(p.chave||'').trim();
      if (!chave) return respostaJson_({ok:false,autorizado:false,mensagem:'Informe a chave do funcionário.'},callback);
      const aba=ss.getSheetByName('Funcionários');
      if (!aba || aba.getLastRow()<2) return respostaJson_({ok:true,autorizado:false,mensagem:'Nenhuma chave de funcionário está cadastrada.'},callback);
      const dados=aba.getRange(2,1,aba.getLastRow()-1,6).getValues();
      for (let i=0;i<dados.length;i++) {
        const funcionario=String(dados[i][0]||'').trim();
        const chavePlanilha=String(dados[i][1]||'').trim();
        const status=normalizarTexto_(dados[i][2]);
        if (chavePlanilha===chave) {
          if (status!=='ATIVO') return respostaJson_({ok:true,autorizado:false,mensagem:'Esta chave está bloqueada. Procure a coordenação.'},callback);
          aba.getRange(i+2,4).setValue(Utilities.formatDate(new Date(),'America/Fortaleza','dd/MM/yyyy HH:mm:ss'));
          aba.getRange(i+2,5).setValue((Number(dados[i][4])||0)+1);
          return respostaJson_({ok:true,autorizado:true,tipo:'funcionario',funcionario:funcionario,mensagem:'Acesso liberado pelo funcionário.'},callback);
        }
      }
      return respostaJson_({ok:true,autorizado:false,mensagem:'Chave de funcionário inválida.'},callback);
    }

    if (p.action==='validarAcesso') {
      const matricula=normalizarTexto_(p.matricula);
      const nome=normalizarTexto_(p.nome);
      const serie=normalizarSerie_(p.serie);
      const preenchidos=[matricula,nome,serie].filter(Boolean).length;
      if (preenchidos<2) return respostaJson_({ok:false,autorizado:false,mensagem:'Preencha pelo menos duas informações para validar.'},callback);

      const aba=ss.getSheetByName('Acessos');
      if (!aba) return respostaJson_({ok:false,autorizado:false,mensagem:'Base de acessos não encontrada.'},callback);
      const ultimaLinha=aba.getLastRow();
      if (ultimaLinha<2) return respostaJson_({ok:true,autorizado:false,mensagem:'Aluno não localizado na base de acesso.'},callback);

      const dados=aba.getRange(2,1,ultimaLinha-1,8).getValues();
      let melhor=null;
      for (let i=0;i<dados.length;i++) {
        const matPlanilha=normalizarTexto_(dados[i][0]);
        const nomePlanilha=normalizarTexto_(dados[i][1]);
        const seriePlanilha=normalizarSerie_(dados[i][2]);
        const status=normalizarTexto_(dados[i][4]);
        let pontos=0;
        if (matricula && matPlanilha===matricula) pontos++;
        if (nome && nomePlanilha===nome) pontos++;
        if (serie && seriePlanilha===serie) pontos++;
        if (!melhor||pontos>melhor.pontos) melhor={indice:i,linha:i+2,pontos,status};

        if (pontos>=2&&status==='ATIVO') {
          aba.getRange(i+2,6).setValue(Utilities.formatDate(new Date(),'America/Fortaleza','dd/MM/yyyy HH:mm:ss'));
          aba.getRange(i+2,7).setValue(0);
          return respostaJson_({ok:true,autorizado:true,tipo:'familia',coincidencias:pontos,aluno:String(dados[i][1]||''),serie:String(dados[i][2]||''),responsavel:String(dados[i][3]||'').trim(),mensagem:'Acesso autorizado.'},callback);
        }
      }

      if (melhor&&melhor.pontos>0) {
        aba.getRange(melhor.linha,7).setValue((Number(dados[melhor.indice][6])||0)+1);
        if (melhor.pontos>=2&&melhor.status!=='ATIVO') return respostaJson_({ok:true,autorizado:false,mensagem:'Cadastro localizado, mas o acesso não está ativo. Procure a secretaria da escola.'},callback);
      }
      return respostaJson_({ok:true,autorizado:false,mensagem:'Não foi possível confirmar duas informações. Confira os dados e tente novamente.'},callback);
    }

    return respostaJson_({ok:true,servico:'Cora Família'},callback);
  } catch (erro) {
    return respostaJson_({ok:false,autorizado:false,mensagem:'Não foi possível validar o acesso agora.',erro:String(erro)},(e&&e.parameter&&e.parameter.callback)||'');
  }
}

function doPost(e) {
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    let sh=ss.getSheetByName('Avaliações');
    if (!sh) {
      sh=ss.insertSheet('Avaliações');
      sh.appendRow(['Data/Hora','Responsável','Funcionário','Canal','Estrelas','Mensagem','Origem','Status']);
    }
    const d=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');
    const canais=['Presencial','WhatsApp','Telefone','Instagram','Outro'];
    const estrelas=Math.max(0,Math.min(5,Number(d.estrelas)||0));
    const canal=canais.indexOf(String(d.canal||''))>=0?String(d.canal):'Outro';
    sh.appendRow([
      Utilities.formatDate(new Date(),'America/Fortaleza','dd/MM/yyyy HH:mm:ss'),
      safeTextForSheet_(d.responsavel||d.nome||'',120),
      safeTextForSheet_(d.funcionario||'',120),
      canal,
      estrelas,
      safeTextForSheet_(d.mensagem||'',2000),
      safeTextForSheet_(d.origem||'Cora Família',80),
      'Recebido'
    ]);
    return respostaJson_({ok:true});
  } catch (erro) {
    return respostaJson_({ok:false,erro:String(erro)});
  }
}
