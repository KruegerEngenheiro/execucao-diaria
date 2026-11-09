// Motor de planejamento. Sugere onde encaixar uma tarefa e detecta conflitos.
// Nunca sobrescreve rotina fixa nem invade o sono (BLOQUEADO).
import type { Tarefa } from '../types'
import type { BlocoDia } from './recorrencia'
import { janelasLivres, janelasFlexiveis, intervalosDeTarefas, capacidadeDoDia } from './janelas'
import { hhmmParaMin, minParaHhmm } from '../utils/datas'

export interface Sugestao {
  inicio: string
  fim: string
  tipo: 'LIVRE' | 'FLEXIVEL'
  sobra: number // minutos que restam na janela depois de encaixar
  origem?: string
}

// Sugestoes de horario para uma tarefa de dada duracao, livre primeiro, flexivel depois.
export function sugerirHorarios(
  duracaoMin: number,
  blocos: BlocoDia[],
  tarefas: Tarefa[],
  limite = 4,
): Sugestao[] {
  const livres = janelasLivres(blocos, tarefas).filter((j) => j.duracao >= duracaoMin)
  const flex = janelasFlexiveis(blocos, tarefas).filter((j) => j.duracao >= duracaoMin)
  const sug: Sugestao[] = []
  for (const j of [...livres, ...flex]) {
    sug.push({
      inicio: j.inicio,
      fim: minParaHhmm(j.inicioMin + duracaoMin),
      tipo: j.tipo,
      sobra: j.duracao - duracaoMin,
      origem: j.origem,
    })
    if (sug.length >= limite) break
  }
  return sug
}

export type TipoConflito = 'sono' | 'rotina' | 'tarefa' | 'foraDoDia'

export interface Conflito {
  tipo: TipoConflito
  com: string // titulo do que conflita
}

export interface Opcao {
  chave: 'encaixar' | 'mover' | 'dividir' | 'outroHorario' | 'semAgendamento'
  rotulo: string
}

export interface ResultadoChecagem {
  ok: boolean
  conflitos: Conflito[]
  opcoes: Opcao[]
  mensagem?: string
}

// Verifica se um horario escolhido manualmente colide com algo.
export function checarHorario(
  inicio: string,
  fim: string,
  blocos: BlocoDia[],
  tarefas: Tarefa[],
  ignorarTarefaId?: number,
): ResultadoChecagem {
  const ini = hhmmParaMin(inicio)
  const f = hhmmParaMin(fim)
  const conflitos: Conflito[] = []

  if (f <= ini) {
    return {
      ok: false,
      conflitos: [{ tipo: 'foraDoDia', com: 'horario invalido' }],
      opcoes: [{ chave: 'outroHorario', rotulo: 'Escolher outro horario' }],
      mensagem: 'O fim precisa ser depois do inicio.',
    }
  }

  for (const b of blocos) {
    const sobrepoe = ini < b.fimMin && f > b.inicioMin
    if (!sobrepoe) continue
    if (b.janela === 'BLOQUEADO') conflitos.push({ tipo: 'sono', com: b.titulo })
    else if (b.janela === 'FIXO' || b.janela === 'FOCO') conflitos.push({ tipo: 'rotina', com: b.titulo })
    // FLEXIVEL e LIVRE nao bloqueiam
  }

  const tarefasInt = tarefas
    .filter((t) => t.id !== ignorarTarefaId)
  for (const it of intervalosDeTarefas(tarefasInt)) {
    if (ini < it.fimMin && f > it.inicioMin) {
      conflitos.push({ tipo: 'tarefa', com: 'outra tarefa agendada' })
    }
  }

  const temSono = conflitos.some((c) => c.tipo === 'sono')
  if (conflitos.length === 0) {
    return { ok: true, conflitos: [], opcoes: [] }
  }

  // Sono nunca pode ser sobrescrito.
  const opcoes: Opcao[] = temSono
    ? [
        { chave: 'outroHorario', rotulo: 'Escolher outro horario' },
        { chave: 'semAgendamento', rotulo: 'Deixar sem horario' },
      ]
    : [
        { chave: 'mover', rotulo: 'Mover pra uma janela livre' },
        { chave: 'dividir', rotulo: 'Dividir em blocos' },
        { chave: 'outroHorario', rotulo: 'Escolher outro horario' },
        { chave: 'semAgendamento', rotulo: 'Deixar sem horario' },
      ]

  const nomes = conflitos.map((c) => c.com)
  const mensagem = temSono
    ? 'Esse horario cai no seu descanso protegido. O sono nao pode ser sobrescrito.'
    : `Esse horario bate com: ${Array.from(new Set(nomes)).join(', ')}.`

  return { ok: false, conflitos, opcoes, mensagem }
}

export interface SituacaoCarga {
  capacidadeMin: number
  planejadoMin: number
  excedeMin: number
  sobrecarregado: boolean
}

// Detecta quando o dia foi planejado com mais tarefa do que cabe.
export function situacaoCarga(blocos: BlocoDia[], tarefas: Tarefa[]): SituacaoCarga {
  const capacidade = capacidadeDoDia(blocos, tarefas)
  const planejado = tarefas
    .filter((t) => t.status !== 'concluida' && t.status !== 'cancelada' && t.status !== 'reagendada')
    .reduce((s, t) => s + (t.duracaoEstimada || 0), 0)
  const excede = Math.max(0, planejado - capacidade)
  return {
    capacidadeMin: capacidade,
    planejadoMin: planejado,
    excedeMin: excede,
    sobrecarregado: excede > 0,
  }
}
