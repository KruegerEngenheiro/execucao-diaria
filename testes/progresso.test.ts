import { describe, it, expect } from 'vitest'
import { progressoDoDia } from '../src/logica/progresso'
import type { Tarefa, RegistroBloco } from '../src/types'

const bloco = (rotinaId: number) => ({ rotinaId })

function tarefa(status: Tarefa['status']): Tarefa {
  return {
    titulo: 't', categoria: 'X', prioridade: 'MEDIA', status,
    duracaoEstimada: 30, duracaoReal: 0, tempoAcumuladoMs: 0, tags: [],
    criadoEm: 0, atualizadoEm: 0,
  }
}

const feito = (rotinaId: number): RegistroBloco => ({ data: '2026-10-26', rotinaId, status: 'feito' })

describe('progressoDoDia', () => {
  it('conta todos os blocos da rotina, nao so os de foco', () => {
    const blocos = [bloco(1), bloco(2), bloco(3), bloco(4)]
    const tarefas = [tarefa('concluida'), tarefa('pendente')]
    const registros = [feito(1), feito(2)]
    const p = progressoDoDia(blocos, tarefas, registros)
    // 2 blocos marcados + 1 tarefa concluida = 3 de 6 (4 blocos + 2 tarefas)
    expect(p.feitas).toBe(3)
    expect(p.total).toBe(6)
    expect(p.pct).toBe(50)
  })

  it('tira reagendada e cancelada do total', () => {
    const p = progressoDoDia([], [tarefa('concluida'), tarefa('reagendada'), tarefa('cancelada')], [])
    expect(p.total).toBe(1)
    expect(p.feitas).toBe(1)
    expect(p.pct).toBe(100)
  })

  it('dia vazio nao quebra nem divide por zero', () => {
    expect(progressoDoDia([], [], [])).toEqual({ feitas: 0, total: 0, pct: 0 })
  })

  it('forca a falha: bloco sem registro nao pode contar como feito', () => {
    const p = progressoDoDia([bloco(1), bloco(2)], [], [feito(1)])
    expect(p.feitas).toBe(1)
    expect(p.total).toBe(2)
    expect(p.pct).toBe(50)
  })

  it('soma as atividades de carreira do dia (extras) no total e nas feitas', () => {
    // 2 blocos (1 feito) + extras de carreira: 2 devidas, 1 marcada = 2 de 4
    const p = progressoDoDia([bloco(1), bloco(2)], [], [feito(1)], { feitas: 1, total: 2 })
    expect(p.total).toBe(4)
    expect(p.feitas).toBe(2)
    expect(p.pct).toBe(50)
  })

  it('sem extras, o comportamento antigo nao muda', () => {
    const p = progressoDoDia([bloco(1)], [tarefa('concluida')], [feito(1)])
    expect(p).toEqual({ feitas: 2, total: 2, pct: 100 })
  })
})
