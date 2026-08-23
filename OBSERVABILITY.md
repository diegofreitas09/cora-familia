# Observabilidade — Cora Família

O Cora Família possui uma camada de observabilidade resiliente em `observability-v45.js`.

## Comportamento padrão

Sem nenhuma configuração adicional, o app:

- captura erros globais e rejeições de Promise em um buffer de sessão;
- registra métricas básicas de navegação e paint;
- mantém no máximo 30 eventos em `sessionStorage`;
- nunca bloqueia o carregamento nem o orçamento caso a telemetria falhe.

## Ativar Sentry

O Sentry é opcional. Para ativar, adicione ao objeto `window.CORA_CONFIG` uma propriedade pública de configuração:

```js
observability: {
  sentryDsn: 'SUA_DSN_PUBLICA',
  environment: 'production',
  release: 'cora-familia-v45',
  tracesSampleRate: 0.05
}
```

A DSN de browser do Sentry pode ser pública, mas **tokens privados, auth tokens e chaves administrativas nunca devem ser adicionados ao repositório**.

## Privacidade

A integração usa `sendDefaultPii: false`. Não adicionar nome de aluno, data de nascimento, matrícula, observações de atendimento ou conteúdo de orçamento em tags/eventos de observabilidade.

## Diagnóstico local

No console do navegador:

```js
CoraObservability.events()
```

retorna apenas o buffer atual da sessão para diagnóstico.
