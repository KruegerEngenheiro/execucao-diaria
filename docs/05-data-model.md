# 05. Modelo de dados

Banco `execucao-diaria` (IndexedDB via Dexie), versao 1. Tabelas e chaves em `src/db.ts`.
Tipos completos em `src/types.ts`.

## Tabelas
- **categorias**: nome, cor, icone, ordem, sistema.
- **rotinas**: regra recorrente. titulo, categoria, janela, inicio, fim, dias[], nota, ativa, ordem.
- **excecoes**: rotinaId, data, acao (pular|mover), novoInicio, novoFim.
- **registrosBloco**: execucao de um bloco de rotina num dia. data, rotinaId, status, inicioReal, fimReal.
- **tarefas**: titulo, descricao, categoria, prioridade, status, data, prazo, inicioPlanejado,
  fimPlanejado, duracaoEstimada, duracaoReal, cronometroInicio, tempoAcumuladoMs, metaId, tags, carimbos.
- **execucoes**: historico de sessoes de cronometro. tarefaId, data, inicioEm, fimEm, duracaoMs.
- **resultados**: tarefaId, data, tipo, valor, unidade, descricao, categoria, metaId.
- **metas**: titulo, categoria, alvo, atual, unidade, tipoResultado, inicio, fim, status.
- **resumos**: fechamento diario. data (unico), percentualExecucao, tarefasConcluidas,
  tarefasContadas, tempoExecutadoMin, score, pendencias[], adiadas[], conquistas, aprendi, melhorar, fechadoEm.
- **config**: tema e preferencias de notificacao.

## Enums
- Janela: BLOQUEADO, FIXO, FLEXIVEL, FOCO, LIVRE.
- Prioridade: CRITICA, ALTA, MEDIA, BAIXA.
- StatusTarefa: pendente, em_andamento, pausada, concluida, reagendada, cancelada.
- TipoResultado: dinheiro, quantidade, tempo, entrega, outro.

## Chaves compostas uteis
- excecoes `[rotinaId+data]`, registrosBloco `[data+rotinaId]`: um registro por bloco por dia.
- resumos `&data`: um fechamento por dia.
