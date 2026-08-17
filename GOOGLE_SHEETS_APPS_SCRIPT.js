// ============================================================
// CORA FAMÍLIA — BACKEND GOOGLE APPS SCRIPT
// Avaliações + validação de acesso por matrícula/aluno/série
// ============================================================

function normalizarTexto_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function respostaJson_(obj, callback) {
  const texto = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + texto + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(texto)
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// VALIDAÇÃO DE ACESSO
// URL: .../exec?action=validarAcesso&matricula=...&nome=...&serie=...
// ============================================================
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const callback = p.callback || '';

    if (p.action !== 'validarAcesso') {
      return respostaJson_({ ok: true, servico: 'Cora Família' }, callback);
    }

    const matricula = normalizarTexto_(p.matricula);
    const nome = normalizarTexto_(p.nome);
    const serie = normalizarTexto_(p.serie);

    if (!matricula || !nome || !serie) {
      return respostaJson_({
        ok: false,
        autorizado: false,
        mensagem: 'Preencha matrícula, nome completo do aluno e série/turma.'
      }, callback);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName('Acessos');

    if (!aba) {
      return respostaJson_({
        ok: false,
        autorizado: false,
        mensagem: 'Base de acessos não encontrada.'
      }, callback);
    }

    const ultimaLinha = aba.getLastRow();
    if (ultimaLinha < 2) {
      return respostaJson_({
        ok: true,
        autorizado: false,
        mensagem: 'Aluno não localizado na base de acesso.'
      }, callback);
    }

    const dados = aba.getRange(2, 1, ultimaLinha - 1, 8).getValues();
    let linhaMatricula = -1;

    for (let i = 0; i < dados.length; i++) {
      const matPlanilha = normalizarTexto_(dados[i][0]);
      if (matPlanilha === matricula) {
        linhaMatricula = i + 2;

        const nomePlanilha = normalizarTexto_(dados[i][1]);
        const seriePlanilha = normalizarTexto_(dados[i][2]);
        const responsavel = String(dados[i][3] || '').trim();
        const status = normalizarTexto_(dados[i][4]);

        if (nomePlanilha === nome && seriePlanilha === serie && status === 'ATIVO') {
          aba.getRange(linhaMatricula, 6).setValue(
            Utilities.formatDate(new Date(), 'America/Fortaleza', 'dd/MM/yyyy HH:mm:ss')
          );
          aba.getRange(linhaMatricula, 7).setValue(0);

          return respostaJson_({
            ok: true,
            autorizado: true,
            aluno: String(dados[i][1] || ''),
            serie: String(dados[i][2] || ''),
            responsavel: responsavel,
            mensagem: 'Acesso autorizado.'
          }, callback);
        }

        const tentativasAtuais = Number(dados[i][6]) || 0;
        aba.getRange(linhaMatricula, 7).setValue(tentativasAtuais + 1);

        if (status !== 'ATIVO') {
          return respostaJson_({
            ok: true,
            autorizado: false,
            mensagem: 'Acesso não está ativo. Procure a secretaria da escola.'
          }, callback);
        }

        return respostaJson_({
          ok: true,
          autorizado: false,
          mensagem: 'Os dados informados não conferem com o cadastro da escola.'
        }, callback);
      }
    }

    return respostaJson_({
      ok: true,
      autorizado: false,
      mensagem: 'Aluno não localizado na base de acesso.'
    }, callback);

  } catch (erro) {
    return respostaJson_({
      ok: false,
      autorizado: false,
      mensagem: 'Não foi possível validar o acesso agora.',
      erro: String(erro)
    }, (e && e.parameter && e.parameter.callback) || '');
  }
}

// ============================================================
// RECEBER AVALIAÇÕES DO APP
// ============================================================
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName('Avaliações');

    if (!sh) {
      sh = ss.insertSheet('Avaliações');
      sh.appendRow([
        'Data/Hora',
        'Responsável',
        'Funcionário',
        'Canal',
        'Estrelas',
        'Mensagem',
        'Origem',
        'Status'
      ]);
    }

    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const dataHora = Utilities.formatDate(
      new Date(),
      'America/Fortaleza',
      'dd/MM/yyyy HH:mm:ss'
    );

    sh.appendRow([
      dataHora,
      d.responsavel || d.nome || '',
      d.funcionario || '',
      d.canal || '',
      d.estrelas || '',
      d.mensagem || '',
      d.origem || 'Cora Família',
      'Recebido'
    ]);

    return respostaJson_({ ok: true });
  } catch (erro) {
    return respostaJson_({ ok: false, erro: String(erro) });
  }
}
