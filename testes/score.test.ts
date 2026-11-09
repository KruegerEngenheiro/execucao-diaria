import { describe, it, expect } from 'vitest'
import { calcularScore } from '../src/logica/score'
import type { Tarefa } from '../src/types'

function tarefa(p: Partial<Tarefa>): Tarefa {
  return {
    titulo: 't', categoria: 'Outros', prioridade: 'MEDIA', status: 'pendente',
    duracaoEstimada: 30, duracaoReal: 0, tempoAcumuladoMs: 0, tags: [],
    criadoEm: 0, atualizadoEm: 0, ...p,
  }
}

describe('score', () => {
  it('dia sem nada relevante retorna nulo', () => {
    const r = calcularScore({ tarefas: [], focoFeitos: 0, focoTotal: 0, numResultados: 0, sequenciaDias: 0 })
    expect(r.score).toBeNull()
  })

  it('tudo feito da score alto', () => {
    const r = calcularScore({
      tarefas: [tarefa({ status: 'concluida', prioridade: 'ALTA' }), tarefa({ status: 'concluida' })],
      focoFeitos: 3, focoTotal: 3, numResultados: 2, sequenciaDias: 5,
    })
    expect(r.score).toBe(100)
  })

  it('nada feito da score baixo mas nao necessariamente zero (consistencia conta)', () => {
    const r = calcularScore({
      tarefas: [tarefa({ status: 'pendente' })],
      focoFeitos: 0, focoTotal: 2, numResultados: 0, sequenciaDias: 5,
    })
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score!).toBeLessThan(30)
  })

  it('REPLANEJAMENTO NAO E FALHA: tarefa reagendada sai da conta de execucao', () => {
    const comReagendada = calcularScore({
      tarefas: [tarefa({ status: 'concluida' }), tarefa({ status: 'reagendada' })],
      focoFeitos: 0, focoTotal: 0, numResultados: 0, sequenciaDias: 0,
    })
    const soConcluida = calcularScore({
      tarefas: [tarefa({ status: 'concluida' })],
      focoFeitos: 0, focoTotal: 0, numResultados: 0, sequenciaDias: 0,
    })
    // A reagendada nao deve derrubar a execucao: os dois casos tem execucao cheia.
    const execCom = comReagendada.componentes.find((c) => c.nome === 'Execucao')!
    const execSo = soConcluida.componentes.find((c) => c.nome === 'Execucao')!
    expect(execCom.valor).toBe(1)
    expect(execSo.valor).toBe(1)
  })

  it('prioridade pesa: concluir CRITICA vale mais que concluir BAIXA', () => {
    const fezCritica = calcularScore({
      tarefas: [tarefa({ status: 'concluida', prioridade: 'CRITICA' }), tarefa({ status: 'pendente', prioridade: 'BAIXA' })],
      focoFeitos: 0, focoTotal: 0, numResultados: 0, sequenciaDias: 0,
    })
    const fezBaixa = calcularScore({
      tarefas: [tarefa({ status: 'pendente', prioridade: 'CRITICA' }), tarefa({ status: 'concluida', prioridade: 'BAIXA' })],
      focoFeitos: 0, focoTotal: 0, numResultados: 0, sequenciaDias: 0,
    })
    const execCritica = fezCritica.componentes.find((c) => c.nome === 'Execucao')!.valor
    const execBaixa = fezBaixa.componentes.find((c) => c.nome === 'Execucao')!.valor
    expect(execCritica).toBeGreaterThan(execBaixa)
  })

  it('pesos renormalizam quando um componente nao se aplica', () => {
    const r = calcularScore({
      tarefas: [tarefa({ status: 'concluida' })],
      focoFeitos: 0, focoTotal: 0, numResultados: 0, sequenciaDias: 0,
    })
    const soma = r.componentes.reduce((s, c) => s + c.pesoAplicado, 0)
    expect(soma).toBeCloseTo(1, 5)
  })
})
