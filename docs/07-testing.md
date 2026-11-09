# 07. Testes e QA

## Testes automatizados (Vitest)
Rodar: `npm test`. 41 testes, 6 arquivos.

- **score.test.ts**: dia nulo, score cheio, score baixo, replanejamento nao e falha,
  peso de prioridade, renormalizacao dos pesos.
- **janelas.test.ts**: FOCO ocupa e cria livre em volta, BLOQUEADO nao vira livre,
  FLEXIVEL vira brecha, tarefa agendada reduz capacidade.
- **planejador.test.ts**: sugestao de horario, bloqueio do sono, conflito com rotina
  fixa, horario livre aceito, fim antes do inicio invalido, sobrecarga, tarefa concluida
  fora da carga.
- **recorrencia.test.ts**: valida a rotina semeada dia a dia (segunda com ingles longo
  fechando o dia, terca com Krueger, quinta sem academia e com dois focos de carreira,
  sono bloqueado, sabado, domingo livre, excecao de pular e de mover).
- **tempo.test.ts**: cronometro pausado e em andamento, formatacao de duracao e relogio.
- **persistencia.test.ts** (fake-indexeddb): seed, criar/iniciar/pausar/concluir,
  concluir com resultado atualizando meta, um cronometro por vez, reagendar e cancelar,
  fechar o dia com score e historico, marcar bloco de foco, dados sobrevivem a reabertura,
  seed nao duplica.

## QA em navegador real (iPhone emulado)
Feito com Chrome headless, viewport de iPhone. Resultado:
- App monta, saudacao com o nome aparece, cinco abas presentes.
- 29 rotinas semeadas no IndexedDB real.
- Criar tarefa pela interface funciona e ela aparece na tela.
- Agenda mostra a rotina (reuniao PIGZ) ao navegar para um dia util.
- Zero erros de console.

## Build
`npm run build` roda typecheck (tsc) e Vite. Compila limpo e gera o service worker (PWA).

## Cenarios do prompt (secao 68) cobertos
Criar, agendar, concluir, iniciar/pausar/finalizar cronometro, registrar resultado,
conflito, reagendar, fechar dia, abrir historico, fechar e reabrir mantendo dados.
