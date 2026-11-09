# 06. Regras de negocio

## Janelas (logica/janelas.ts)
- BLOQUEADO, FIXO e FOCO ocupam o horario: nao se agenda tarefa por cima.
- FLEXIVEL admite tarefa pequena nas brechas (expediente).
- LIVRE e tempo aberto.
- Dia planejavel entre 06:00 e 23:00.
- Capacidade do dia = tempo livre + brechas flexiveis.

## Planejamento (logica/planejador.ts)
- `sugerirHorarios`: oferece janelas que comportam a duracao, livre primeiro, flexivel depois.
- `checarHorario`: ao escolher um horario na mao, acusa conflito com sono, rotina fixa ou outra tarefa.
  - Sono (BLOQUEADO) nunca pode ser sobrescrito: nao ha opcao de encaixar por cima.
  - Conflito com rotina ou tarefa oferece mover, dividir, outro horario ou deixar sem hora.
- `situacaoCarga`: soma a duracao das tarefas pendentes do dia e compara com a capacidade.
  Se passar, avisa o quanto excede. Tarefas concluidas, canceladas e reagendadas nao contam na carga.

## Rotina x realidade
- A rotina e regra recorrente; cada dia gera instancias (logica/recorrencia.ts).
- Excecao altera um unico dia (pular ou mover), sem mexer na regra.
- registrosBloco guarda o realizado (feito, horario real) separado do planejado.

## Score (logica/score.ts)
Score de 0 a 100 com quatro componentes, pesos base:
- Execucao ponderada por prioridade: 0.45
- Blocos de foco cumpridos: 0.30
- Resultados registrados: 0.15
- Consistencia (dias em sequencia): 0.10

Peso de prioridade: CRITICA 4, ALTA 3, MEDIA 2, BAIXA 1.
Execucao = soma dos pesos concluidos / soma dos pesos contados.

**Replanejamento nao e falha (prompt secao 26):** tarefa reagendada ou cancelada sai
da conta; nao derruba o score. Tarefa que ficou pendente no fim do dia conta como nao feita.

**Renormalizacao:** se um componente nao se aplica (dia sem tarefa, dia sem foco), ele
sai da media e os pesos restantes sao reescalados para somar 1.

**Dia sem nada relevante** (sem tarefa contada, sem foco, sem resultado) nao recebe
score (fica em branco). O score e sempre explicado na tela de fechamento.

## Metas (servicos.ts)
- Meta com tipo de resultado soma automaticamente os resultados ligados a ela.
- Meta manual recebe avanco na mao.
- Ao atingir o alvo, a meta vira concluida.

## Descanso protegido (prompt secao 41)
O app nunca sugere ocupar o horario de sono. O bloco 21:30 as 22:30 nos dias uteis
nasce BLOQUEADO na rotina semeada.
