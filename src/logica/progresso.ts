// Progresso do dia: conta TODAS as atividades da agenda, nao so os blocos de foco.
// Cada bloco de rotina marcado (acordar, cafe, expediente, reuniao, foco) e cada
// tarefa concluida sobe a porcentagem. A ideia e ver pequenas atitudes somando.
// Reagendada e cancelada sao replanejamento legitimo e saem do total.
import type { Tarefa, RegistroBloco } from '../types'

export interface Progresso {
  feitas: number
  total: number
  pct: number
}

export function progressoDoDia(
  blocos: { rotinaId: number }[],
  tarefas: Tarefa[],
  registros: RegistroBloco[],
  extras?: { feitas: number; total: number },
): Progresso {
  const contadas = tarefas.filter((t) => t.status !== 'reagendada' && t.status !== 'cancelada')
  const concluidas = contadas.filter((t) => t.status === 'concluida')
  const blocosFeitos = blocos.filter((b) =>
    registros.some((r) => r.rotinaId === b.rotinaId && r.status === 'feito'),
  ).length

  // extras: atividades do Plano de carreira devidas hoje, para a % do dia contar
  // tambem o avanco da carreira, nao so rotina e tarefas.
  const total = contadas.length + blocos.length + (extras?.total ?? 0)
  const feitas = concluidas.length + blocosFeitos + (extras?.feitas ?? 0)
  const pct = total > 0 ? Math.round((feitas / total) * 100) : 0
  return { feitas, total, pct }
}
