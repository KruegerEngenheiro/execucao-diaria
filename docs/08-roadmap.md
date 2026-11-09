# 08. Roadmap

## Entregue agora (MVP + nucleo da fase 2)
- Rotina semeada e editavel, excecoes por dia.
- Tarefas completas, execucao com cronometro, resultados.
- Motor de janelas, planejamento, conflito, sobrecarga.
- Timeline, progresso, fechar o dia, score transparente.
- Metas, calendario do mes, visao de semana, insights basicos.
- Claro e escuro, offline, instalavel, backup JSON.

## Fase 2, o que ainda da pra aprofundar
- Notificacoes agendadas por horario (hoje a permissao e pedida; o disparo por horario
  no iOS depende de push ou periodic background sync, com limites do iOS).
- Recorrencia avancada de tarefas (nao so de rotina).
- Mais insights (horario mais produtivo, metas em risco).

## Fase 3, arquitetura ja preparada
- Entrada por linguagem natural ("hoje as 20:30 estudar Python por uma hora").
- Integracao com IA/ChatGPT: criar tarefas por texto e perguntar "o que fiz hoje",
  "quanto estudei IA essa semana". A camada de dados limpa (servicos.ts) e o backup JSON
  sao a base. Nenhuma chave de API vai no codigo; a integracao usaria um proxy proprio.
- Sincronizacao entre aparelhos (iPhone, iPad, Web) e backup na nuvem, sobre a mesma
  camada de dados.

## Nao fazer (por decisao de produto)
Rede social, multiusuario, chat, gamificacao, excesso de graficos, IA so por ter IA.
