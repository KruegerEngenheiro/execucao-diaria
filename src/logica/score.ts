// Score diario de 0 a 100. Transparente e documentado.
//
// FORMULA
// O score combina quatro componentes, cada um normalizado de 0 a 1:
//   1. Execucao ponderada por prioridade  (peso base 0.45)
//   2. Blocos de foco cumpridos           (peso base 0.30)
//   3. Resultados registrados             (peso base 0.15)
//   4. Consistencia (sequencia de dias)   (peso base 0.10)
//
// Peso por prioridade na execucao: CRITICA 4, ALTA 3, MEDIA 2, BAIXA 1.
// Execucao = soma dos pesos das tarefas concluidas / soma dos pesos das tarefas CONTADAS.
//
// REPLANEJAMENTO NAO E FALHA (ver prompt secao 26):
// tarefas 'reagendada' e 'cancelada' saem da conta, nao derrubam o score.
// Tarefa que ficou 'pendente'/'pausada' no fim do dia conta como nao feita.
//
// Se um componente nao se aplica ao dia (ex: nenhuma tarefa, nenhum bloco de foco),
// ele sai da media e os pesos restantes sao renormalizados.
// Dia sem nenhum dado relevante retorna score nulo (tracinho na interface).
import type { Tarefa, Prioridade } from '../types'

const PESO_PRIORIDADE: Record<Prioridade, number> = {
  CRITICA: 4, ALTA: 3, MEDIA: 2, BAIXA: 1,
}

const PESO_BASE = { execucao: 0.45, foco: 0.30, resultados: 0.15, consistencia: 0.10 }

export interface ComponenteScore {
  nome: string
  valor: number // 0..1
  pesoAplicado: number // 0..1 depois de renormalizar
  detalhe: string
}

export interface EntradaScore {
  tarefas: Tarefa[] // tarefas do dia
  focoFeitos: number
  focoTotal: number
  numResultados: number
  sequenciaDias: number // dias fechados em sequencia
}

export interface SaidaScore {
  score: number | null
  componentes: ComponenteScore[]
}

export function calcularScore(e: EntradaScore): SaidaScore {
  // Execucao
  const contadas = e.tarefas.filter(
    (t) => t.status !== 'reagendada' && t.status !== 'cancelada',
  )
  const somaPesos = contadas.reduce((s, t) => s + PESO_PRIORIDADE[t.prioridade], 0)
  const somaFeitas = contadas
    .filter((t) => t.status === 'concluida')
    .reduce((s, t) => s + PESO_PRIORIDADE[t.prioridade], 0)
  const execDisponivel = contadas.length > 0
  const execucao = execDisponivel ? somaFeitas / somaPesos : 0

  // Foco
  const focoDisponivel = e.focoTotal > 0
  const foco = focoDisponivel ? e.focoFeitos / e.focoTotal : 0

  // Resultados: dois resultados ja valem cheio.
  const resultados = Math.min(1, e.numResultados / 2)

  // Consistencia: cinco dias em sequencia valem cheio.
  const consistencia = Math.min(1, e.sequenciaDias / 5)

  // Dia sem nada relevante: sem score.
  if (!execDisponivel && !focoDisponivel && e.numResultados === 0) {
    return { score: null, componentes: [] }
  }

  // Monta componentes disponiveis e renormaliza pesos.
  const brutos: { nome: string; valor: number; pesoBase: number; detalhe: string }[] = []
  if (execDisponivel) {
    brutos.push({
      nome: 'Execucao',
      valor: execucao,
      pesoBase: PESO_BASE.execucao,
      detalhe: `${contadas.filter((t) => t.status === 'concluida').length} de ${contadas.length} tarefas, por prioridade`,
    })
  }
  if (focoDisponivel) {
    brutos.push({
      nome: 'Foco',
      valor: foco,
      pesoBase: PESO_BASE.foco,
      detalhe: `${e.focoFeitos} de ${e.focoTotal} blocos de foco`,
    })
  }
  brutos.push({
    nome: 'Resultados',
    valor: resultados,
    pesoBase: PESO_BASE.resultados,
    detalhe: `${e.numResultados} registrados`,
  })
  brutos.push({
    nome: 'Consistencia',
    valor: consistencia,
    pesoBase: PESO_BASE.consistencia,
    detalhe: `${e.sequenciaDias} dias em sequencia`,
  })

  const somaPesoBase = brutos.reduce((s, b) => s + b.pesoBase, 0)
  const componentes: ComponenteScore[] = brutos.map((b) => ({
    nome: b.nome,
    valor: b.valor,
    pesoAplicado: b.pesoBase / somaPesoBase,
    detalhe: b.detalhe,
  }))

  const score = Math.round(
    componentes.reduce((s, c) => s + c.valor * c.pesoAplicado, 0) * 100,
  )
  return { score, componentes }
}
