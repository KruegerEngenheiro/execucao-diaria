import { describe, it, expect } from 'vitest'
import { janelasLivres, janelasFlexiveis, capacidadeDoDia } from '../src/logica/janelas'
import type { BlocoDia } from '../src/logica/recorrencia'
import type { Tarefa } from '../src/types'
import { hhmmParaMin } from '../src/utils/datas'

function bloco(inicio: string, fim: string, janela: BlocoDia['janela'], id = 1): BlocoDia {
  return { rotinaId: id, titulo: janela, categoria: 'x', janela, inicio, fim, inicioMin: hhmmParaMin(inicio), fimMin: hhmmParaMin(fim) }
}
function tarefa(inicio: string, fim: string): Tarefa {
  return {
    titulo: 't', categoria: 'x', prioridade: 'MEDIA', status: 'pendente',
    inicioPlanejado: inicio, fimPlanejado: fim, duracaoEstimada: 30, duracaoReal: 0,
    tempoAcumuladoMs: 0, tags: [], criadoEm: 0, atualizadoEm: 0,
  }
}

describe('janelas', () => {
  it('bloco FOCO ocupa e cria tempo livre em volta', () => {
    const livres = janelasLivres([bloco('20:00', '21:00', 'FOCO')], [])
    // deve haver livre antes das 20:00 e depois das 21:00 (ate 23:00)
    const temAntes = livres.some((l) => l.fim === '20:00')
    const temDepois = livres.some((l) => l.inicio === '21:00')
    expect(temAntes).toBe(true)
    expect(temDepois).toBe(true)
  })

  it('bloco BLOQUEADO nao aparece como livre', () => {
    const livres = janelasLivres([bloco('21:30', '22:30', 'BLOQUEADO')], [])
    const invade = livres.some((l) => hhmmParaMin(l.inicio) < hhmmParaMin('22:30') && hhmmParaMin(l.fim) > hhmmParaMin('21:30'))
    expect(invade).toBe(false)
  })

  it('bloco FLEXIVEL conta como brecha, nao como livre rigido', () => {
    const blocos = [bloco('08:00', '12:00', 'FLEXIVEL')]
    const flex = janelasFlexiveis(blocos, [])
    expect(flex.length).toBe(1)
    expect(flex[0].duracao).toBe(240)
  })

  it('tarefa agendada reduz a capacidade', () => {
    const blocos = [bloco('20:00', '21:00', 'FOCO')]
    const semTarefa = capacidadeDoDia(blocos, [])
    const comTarefa = capacidadeDoDia(blocos, [tarefa('18:00', '19:00')])
    expect(comTarefa).toBe(semTarefa - 60)
  })
})
