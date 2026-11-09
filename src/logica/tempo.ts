// Helpers de cronometro e formatacao de duracao.
import type { Tarefa } from '../types'

// Milissegundos totais ja investidos numa tarefa, incluindo a sessao em andamento.
export function msDecorridos(t: Tarefa, agora: number = Date.now()): number {
  const base = t.tempoAcumuladoMs || 0
  if (t.status === 'em_andamento' && t.cronometroInicio) {
    return base + Math.max(0, agora - t.cronometroInicio)
  }
  return base
}

// '1h 20min', '45min', '30s'. Entrada em milissegundos.
export function formataDuracaoMs(ms: number): string {
  const totalSeg = Math.round(ms / 1000)
  const h = Math.floor(totalSeg / 3600)
  const m = Math.floor((totalSeg % 3600) / 60)
  const s = totalSeg % 60
  if (h > 0) return m > 0 ? `${h}h ${m}min` : `${h}h`
  if (m > 0) return `${m}min`
  return `${s}s`
}

// Cronometro vivo 'HH:MM:SS' para a tela de execucao.
export function relogio(ms: number): string {
  const totalSeg = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeg / 3600)
  const m = Math.floor((totalSeg % 3600) / 60)
  const s = totalSeg % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// Minutos para texto curto '1h20' / '45min'.
export function formataMin(min: number): string {
  if (min <= 0) return '0min'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0) return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
  return `${m}min`
}
