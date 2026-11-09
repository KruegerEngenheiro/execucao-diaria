// Motor de janelas. A partir dos blocos de rotina e das tarefas ja agendadas,
// descobre o que esta ocupado e onde ha tempo livre no dia.
import type { Tarefa } from '../types'
import type { BlocoDia } from './recorrencia'
import { hhmmParaMin, minParaHhmm } from '../utils/datas'

// Limites do dia planejavel.
export const DIA_INICIO = 6 * 60 // 06:00
export const DIA_FIM = 23 * 60 // 23:00

export interface Intervalo {
  inicioMin: number
  fimMin: number
  inicio: string
  fim: string
}

export interface JanelaLivre extends Intervalo {
  tipo: 'LIVRE' | 'FLEXIVEL'
  duracao: number // minutos
  origem?: string // titulo do bloco flexivel, quando for o caso
}

function faz(inicioMin: number, fimMin: number): Intervalo {
  return { inicioMin, fimMin, inicio: minParaHhmm(inicioMin), fim: minParaHhmm(fimMin) }
}

// Tarefas agendadas desse dia viram intervalos ocupados.
export function intervalosDeTarefas(tarefas: Tarefa[]): Intervalo[] {
  return tarefas
    .filter((t) => t.inicioPlanejado && t.fimPlanejado && t.status !== 'cancelada')
    .map((t) => faz(hhmmParaMin(t.inicioPlanejado!), hhmmParaMin(t.fimPlanejado!)))
    .sort((a, b) => a.inicioMin - b.inicioMin)
}

// Os blocos que de fato impedem agendar por cima: bloqueado, fixo e foco.
// Flexivel nao entra aqui porque admite tarefa pequena nas brechas.
function blocosRigidos(blocos: BlocoDia[]): Intervalo[] {
  return blocos
    .filter((b) => b.janela === 'BLOQUEADO' || b.janela === 'FIXO' || b.janela === 'FOCO')
    .map((b) => faz(b.inicioMin, b.fimMin))
}

// Uniao de intervalos ocupados (rigidos + tarefas agendadas).
function unir(intervalos: Intervalo[]): Intervalo[] {
  const ord = [...intervalos].sort((a, b) => a.inicioMin - b.inicioMin)
  const out: Intervalo[] = []
  for (const it of ord) {
    const ultimo = out[out.length - 1]
    if (ultimo && it.inicioMin <= ultimo.fimMin) {
      ultimo.fimMin = Math.max(ultimo.fimMin, it.fimMin)
      ultimo.fim = minParaHhmm(ultimo.fimMin)
    } else {
      out.push({ ...it })
    }
  }
  return out
}

// Janelas livres de verdade (nenhuma atividade planejada) entre DIA_INICIO e DIA_FIM.
export function janelasLivres(blocos: BlocoDia[], tarefas: Tarefa[]): JanelaLivre[] {
  const ocupado = unir([...blocosRigidos(blocos), ...intervalosDeTarefas(tarefas)])
  const livres: JanelaLivre[] = []
  let cursor = DIA_INICIO
  for (const oc of ocupado) {
    if (oc.inicioMin > cursor) {
      const i = faz(cursor, Math.min(oc.inicioMin, DIA_FIM))
      if (i.fimMin > i.inicioMin) {
        livres.push({ ...i, tipo: 'LIVRE', duracao: i.fimMin - i.inicioMin })
      }
    }
    cursor = Math.max(cursor, oc.fimMin)
    if (cursor >= DIA_FIM) break
  }
  if (cursor < DIA_FIM) {
    const i = faz(cursor, DIA_FIM)
    livres.push({ ...i, tipo: 'LIVRE', duracao: i.fimMin - i.inicioMin })
  }
  return livres
}

// Janelas flexiveis ainda nao tomadas por tarefa agendada (cabe tarefa pequena nas brechas).
export function janelasFlexiveis(blocos: BlocoDia[], tarefas: Tarefa[]): JanelaLivre[] {
  const tarefasInt = intervalosDeTarefas(tarefas)
  const flex: JanelaLivre[] = []
  for (const b of blocos) {
    if (b.janela !== 'FLEXIVEL') continue
    // desconta tarefas ja encaixadas dentro do bloco flexivel
    let livre = b.fimMin - b.inicioMin
    for (const t of tarefasInt) {
      const ini = Math.max(b.inicioMin, t.inicioMin)
      const fim = Math.min(b.fimMin, t.fimMin)
      if (fim > ini) livre -= fim - ini
    }
    if (livre > 0) {
      flex.push({ ...faz(b.inicioMin, b.fimMin), tipo: 'FLEXIVEL', duracao: livre, origem: b.titulo })
    }
  }
  return flex
}

// Capacidade util do dia em minutos: tempo livre + brechas flexiveis.
export function capacidadeDoDia(blocos: BlocoDia[], tarefas: Tarefa[]): number {
  const livre = janelasLivres(blocos, tarefas).reduce((s, j) => s + j.duracao, 0)
  const flex = janelasFlexiveis(blocos, tarefas).reduce((s, j) => s + j.duracao, 0)
  return livre + flex
}
