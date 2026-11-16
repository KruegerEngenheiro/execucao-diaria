# Candidaturas: JSON de perfil e respostas

Modulo de candidaturas (E0 e E1). Tudo local, so no aparelho. O app nao envia candidatura nenhuma: "enviada" e o registro manual de que voce enviou.

## Onde importar

Configuracoes > Perfil para candidaturas > Importar perfil e respostas (JSON).

O arquivo fica so no seu aparelho. Nunca coloque dado pessoal no codigo nem no repositorio. Um arquivo de exemplo, so com texto de mentirinha, esta em `docs/exemplos/perfil-candidaturas.exemplo.json`.

## Regra central: confirmado

So o que tiver `"confirmado": true` (booleano de verdade, sem aspas) conta como confirmado e pode virar texto de candidatura. Tudo o mais fica **pendente de confirmacao**: `"true"`, `"sim"`, `1`, campo ausente, valor vazio.

Se um texto de resposta muda no arquivo e o novo item nao vem com `confirmado: true`, a confirmacao anterior cai.

## Formato

```json
{
  "perfil": [
    { "chave": "nome", "rotulo": "Nome completo", "valor": "...", "confirmado": true, "fonte": "curriculo" }
  ],
  "respostasBase": [
    {
      "chave": "por-que-essa-vaga",
      "rotulo": "Por que essa vaga",
      "pergunta": "Why this role?",
      "textoPt": "...",
      "textoEn": "...",
      "confirmado": true,
      "fonte": "..."
    }
  ],
  "curriculos": [
    { "chave": "EN-internacional", "versao": "...", "hash": "...", "arquivo": "...", "formato": "DOCX" }
  ]
}
```

Os tres blocos sao opcionais, mas pelo menos um precisa existir.

| Bloco | Campos | Observacao |
|---|---|---|
| `perfil` | `chave` (obrigatoria, unica), `valor`, `confirmado`, `rotulo`, `fonte` | Uma linha so no aparelho. Importar de novo substitui o perfil inteiro. |
| `respostasBase` | `chave` (obrigatoria, unica), `rotulo`, `pergunta`, `textoPt`, `textoEn`, `confirmado`, `fonte` | Importar de novo atualiza por `chave`. A resposta so entra na candidatura no idioma da vaga, e so se existir texto confirmado naquele idioma. Nao ha traducao automatica. |
| `curriculos` | `chave` (so `EN-internacional` ou `PT-brasil`), `versao`, `hash`, `arquivo`, `formato` | Referencia aos 2 curriculos reais. O arquivo em si nao e guardado. Qualquer outra chave e recusada: o sistema escolhe entre os dois, nao cria curriculo novo. |

## O que acontece com erro

- JSON quebrado: nada e importado.
- Chave faltando ou repetida, bloco que nao e lista, curriculo com chave desconhecida: importacao recusada inteira, sem gravar nada.
- Itens sem `confirmado: true`: importados como pendentes, com aviso.

## Backup

O backup (JSON) agora leva todas as tabelas, inclusive perfil e respostas. Guarde o arquivo com cuidado. Restaurar um backup so substitui as tabelas que estao no arquivo, e recusa arquivo de versao mais nova que o app.
