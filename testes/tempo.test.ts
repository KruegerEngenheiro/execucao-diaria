import { describe, it, expect } from 'vitest'
import { msDecorridos, formataDuracaoMs, relogio, formataMin } from '../src/logica/tempo'
import type { Tarefa } from '../src/types'

function tarefa(p: Partial<Tarefa>): Tarefa {
  return {
    titulo: 't', categoria: 'x', prioridade: 'MEDIA', status: 'pendente',
    duracaoEstimada: 30, duracaoReal: 0, tempoAcumuladoMs: 0, tags: [], criadoEm: 0, atualizadoEm: 0, ...p,
  }
}

describe('tempo e cronometro', () => {
  it('tarefa pausada mostra so o acumulado', () => {
    const t = tarefa({ status: 'pausada', tempoAcumuladoMs: 90000 })
    expect(msDecorridos(t, 999999999)).toBe(90000)
  })

  it('tarefa em andamento soma a sessao corrente', () => {
    const inicio = 1000
    const agora = 1000 + 60000 // 1 minuto depois
    const t = tarefa({ status: 'em_andamento', cronometroInicio: inicio, tempoAcumuladoMs: 30000 })
    expect(msDecorridos(t, agora)).toBe(90000) // 30s acumulado + 60s corrente
  })

  it('formata duracao', () => {
    expect(formataDuracaoMs(90 * 60000)).toBe('1h 30min')
    expect(formataDuracaoMs(45 * 60000)).toBe('45min')
  })

  it('relogio vivo', () => {
    expect(relogio(65000)).toBe('01:05')
    expect(relogio(3661000)).toBe('1:01:01')
  })

  it('formata minutos', () => {
    expect(formataMin(80)).toBe('1h20')
    expect(formataMin(60)).toBe('1h')
    expect(formataMin(40)).toBe('40min')
  })
})
