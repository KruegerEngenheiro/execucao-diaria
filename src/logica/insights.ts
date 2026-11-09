// Insights simples e honestos. So aparecem quando ha dados suficientes.
import type { ResumoDiario, Resultado, Tarefa } from '../types'
import { diaDaSemana, nomeDiaLongo } from '../utils/datas'
import { formataMin } from './tempo'

export interface Insight {
  texto: string
}

export interface EntradaInsights {
  resumos: ResumoDiario[] // ultimos dias fechados
  resultados: Resultado[] // do periodo
  tarefas: Tarefa[] // do periodo
}

export function gerarInsights(e: EntradaInsights): Insight[] {
  const out: Insight[] = []
  const DIAS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

  // Precisa de pelo menos 3 dias fechados para falar qualquer coisa.
  if (e.resumos.length < 3) return out

  // Melhor dia da semana por score medio.
  const porDia = new Map<number, number[]>()
  for (const r of e.resumos) {
    const d = diaDaSemana(r.data)
    const arr = porDia.get(d) ?? []
    arr.push(r.score)
    porDia.set(d, arr)
  }
  let melhorDia = -1
  let melhorMedia = -1
  for (const [dia, scores] of porDia) {
    if (scores.length < 2) continue
    const media = scores.reduce((s, v) => s + v, 0) / scores.length
    if (media > melhorMedia) {
      melhorMedia = media
      melhorDia = dia
    }
  }
  if (melhorDia >= 0) {
    out.push({ texto: `Seu melhor dia costuma ser ${DIAS[melhorDia].toLowerCase()}.` })
  }

  // Tempo por categoria no periodo.
  const porCategoria = new Map<string, number>()
  for (const t of e.tarefas) {
    if (t.duracaoReal > 0) {
      porCategoria.set(t.categoria, (porCategoria.get(t.categoria) ?? 0) + t.duracaoReal)
    }
  }
  const topCat = [...porCategoria.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topCat && topCat[1] >= 60) {
    out.push({ texto: `No periodo, voce dedicou ${formataMin(topCat[1])} a ${topCat[0]}.` })
  }

  // Adiamento de baixa prioridade.
  const baixas = e.tarefas.filter((t) => t.prioridade === 'BAIXA')
  const baixasReagendadas = baixas.filter((t) => t.status === 'reagendada').length
  if (baixas.length >= 4 && baixasReagendadas / baixas.length >= 0.5) {
    out.push({ texto: 'Voce costuma reagendar as tarefas de baixa prioridade.' })
  }

  // Score medio recente.
  const mediaScore = Math.round(e.resumos.reduce((s, r) => s + r.score, 0) / e.resumos.length)
  out.push({ texto: `Sua media de score nos ultimos ${e.resumos.length} dias fechados e ${mediaScore}.` })

  return out
}

// Pequeno helper usado na tela de hoje para a saudacao.
export function saudacao(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function nomeDoDia(iso: string): string {
  return nomeDiaLongo(iso)
}
