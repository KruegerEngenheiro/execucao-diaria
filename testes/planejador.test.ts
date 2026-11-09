import { describe, it, expect } from 'vitest'
import { sugerirHorarios, checarHorario, situacaoCarga } from '../src/logica/planejador'
import type { BlocoDia } from '../src/logica/recorrencia'
import type { Tarefa } from '../src/types'
import { hhmmParaMin } from '../src/utils/datas'

function bloco(inicio: string, fim: string, janela: BlocoDia['janela'], titulo: string = janela, id = 1): BlocoDia {
  return { rotinaId: id, titulo, categoria: 'x', janela, inicio, fim, inicioMin: hhmmParaMin(inicio), fimMin: hhmmParaMin(fim) }
}
function tarefa(p: Partial<Tarefa>): Tarefa {
  return {
    titulo: 't', categoria: 'x', prioridade: 'MEDIA', status: 'pendente',
    duracaoEstimada: 60, duracaoReal: 0, tempoAcumuladoMs: 0, tags: [], criadoEm: 0, atualizadoEm: 0, ...p,
  }
}

describe('planejador', () => {
  it('sugere horario numa janela livre que comporta a duracao', () => {
    const sug = sugerirHorarios(45, [bloco('20:00', '21:00', 'FOCO')], [])
    expect(sug.length).toBeGreaterThan(0)
    expect(sug[0].sobra).toBeGreaterThanOrEqual(0)
  })

  it('NAO deixa agendar por cima do sono (BLOQUEADO)', () => {
    const r = checarHorario('21:45', '22:15', [bloco('21:30', '22:30', 'BLOQUEADO', 'Dormir')], [])
    expect(r.ok).toBe(false)
    expect(r.conflitos.some((c) => c.tipo === 'sono')).toBe(true)
    // nao oferece a opcao de encaixar por cima
    expect(r.opcoes.some((o) => o.chave === 'encaixar')).toBe(false)
  })

  it('acusa conflito com rotina FIXA', () => {
    const r = checarHorario('09:10', '09:40', [bloco('09:00', '09:30', 'FIXO', 'Reuniao PIGZ')], [])
    expect(r.ok).toBe(false)
    expect(r.conflitos.some((c) => c.tipo === 'rotina')).toBe(true)
  })

  it('horario livre e aceito', () => {
    const r = checarHorario('15:00', '15:30', [bloco('09:00', '09:30', 'FIXO')], [])
    expect(r.ok).toBe(true)
  })

  it('fim antes do inicio e invalido', () => {
    const r = checarHorario('10:00', '09:00', [], [])
    expect(r.ok).toBe(false)
  })

  it('detecta sobrecarga do dia', () => {
    const blocos = [bloco('08:00', '17:00', 'FIXO'), bloco('21:30', '22:30', 'BLOQUEADO')]
    const tarefas = [
      tarefa({ duracaoEstimada: 180 }),
      tarefa({ duracaoEstimada: 180 }),
      tarefa({ duracaoEstimada: 180 }),
    ]
    const s = situacaoCarga(blocos, tarefas)
    expect(s.planejadoMin).toBe(540)
    // o dia nao tem 9h livres, entao deve sobrecarregar
    expect(s.sobrecarregado).toBe(true)
  })

  it('tarefa concluida nao conta como carga planejada', () => {
    const s = situacaoCarga([], [tarefa({ status: 'concluida', duracaoEstimada: 120 })])
    expect(s.planejadoMin).toBe(0)
  })
})
