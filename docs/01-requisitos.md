# 01. Requisitos

## O que e
Sistema Pessoal de Execucao, nao uma lista de tarefas. Ele responde todo dia:
o que fazer, quando, o que esta rolando agora, o que ja fiz, o que deixei, quanto
tempo investi, quanto avancei, o que produzi e o que faco amanha.

## Requisitos funcionais (entregues)
- Rotina semanal recorrente, editavel, com excecoes por dia (pular ou mover).
- Tarefas: criar, editar, excluir, concluir, com prioridade, categoria, duracao e prazo.
- Tarefa agendada (com horario) e tarefa so com prazo (sem horario).
- Execucao com cronometro: iniciar, pausar, continuar, concluir. Um cronometro por vez.
- Registro de resultado ao concluir: texto e quantitativo (dinheiro, quantidade, tempo, entrega, outro).
- Motor de janelas: BLOQUEADO, FIXO, FLEXIVEL, FOCO, LIVRE.
- Motor de planejamento: sugere horario, detecta conflito, nunca agenda por cima de rotina fixa nem do sono.
- Aviso de sobrecarga quando o dia foi planejado com mais do que cabe.
- Timeline do dia misturando rotina e tarefas (planejado x realizado).
- Progresso do dia, fechar o dia, score transparente (0 a 100).
- Metas com avanco manual ou soma automatica de resultados.
- Historico com calendario do mes e visao de semana; abrir o fechamento de qualquer dia.
- Insights simples, so quando ha dados (3+ dias fechados).
- Backup: exportar e importar JSON.
- Claro e escuro, instalavel no iPhone, funciona offline.

## Requisitos nao funcionais
- iPhone-first: Safe Area, uso com uma mao, tab bar inferior, toques grandes.
- Offline real: dados no proprio aparelho (IndexedDB), sobrevivem ao fechar o app.
- Acessibilidade: contraste, rotulos, reducao de movimento, texto escalavel.
- Sem secrets no codigo. Sem servidor obrigatorio.

## Fora de escopo (por decisao)
- Rede social, multiusuario, chat, gamificacao, excesso de graficos.
- Nativo iOS (App Store): exigiria Mac e conta Apple paga. Ver 02-arquitetura.
