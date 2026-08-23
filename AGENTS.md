# Cora Família — Instruções obrigatórias para agentes

Estas regras valem para qualquer agente, modelo ou pessoa que altere este repositório.

## Fluxo de trabalho obrigatório

1. Toda correção, melhoria ou nova função deve começar por uma **GitHub Issue**.
2. Cada mudança de código deve acontecer em uma **branch própria**, preferencialmente no formato `tipo/issue-N-descricao`.
3. Toda mudança destinada a produção deve ser entregue por **Pull Request**.
4. O corpo do PR deve mencionar a Issue correspondente usando `Closes #N`, `Fixes #N` ou `Refs #N`.
5. O PR deve descrever: objetivo, arquivos alterados, risco, testes executados e plano de rollback.
6. Não fazer deploy direto em `main` quando houver alternativa por PR.
7. Não remover comportamento funcional já validado sem uma Issue específica e justificativa.

## Segurança de mudança

- Priorizar alterações pequenas, reversíveis e compatíveis com a versão atual.
- Evitar colocar segredos, tokens, senhas ou chaves privadas em JavaScript público, HTML, CSS ou arquivos versionados.
- Endpoints públicos e IDs não devem ser tratados como segredos.
- Mudanças em autenticação, Apps Script, planilhas ou Drive exigem teste de regressão do fluxo de orçamento.

## Motion e experiência

Ao criar ou revisar movimento, seguir os princípios do projeto `kylezantos/design-motion-principles`:

- animação deve ter propósito;
- interações frequentes devem ser rápidas ou instantâneas;
- usar transições sutis em produto de uso recorrente;
- evitar animação decorativa em excesso, pulse contínuo e `scale` em todo hover;
- sempre respeitar `prefers-reduced-motion`;
- priorizar performance e propriedades como `opacity` e `transform`;
- skeletons e estados de carregamento devem reduzir incerteza, não apenas decorar.

Para o Cora Família, usar principalmente a lente de **polimento de produção**, com moderação de motion em interações frequentes.

## Qualidade

Antes de mergear:

- executar lint/checagens configuradas no repositório;
- executar testes automatizados existentes;
- verificar fluxo principal em mobile e desktop;
- confirmar ausência de erros de console relevantes;
- confirmar que o PR referencia a Issue.

## Observabilidade

Erros de produção e falhas de rede relevantes devem ser capturáveis por uma camada de observabilidade configurável. Nenhuma integração pode quebrar o app caso a ferramenta externa esteja indisponível.

## Deploy

`main` representa a versão de produção publicada pelo GitHub Pages. Alterações devem entrar em `main` somente após PR, checagens e revisão do risco. Em caso de regressão, priorizar rollback do PR/commit antes de criar novos patches sobrepostos.
