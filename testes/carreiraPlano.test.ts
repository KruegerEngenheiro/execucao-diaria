import { describe, it, expect } from 'vitest'
import { atividadesDoDia, progressoPlano, porCategoria, chaveCarreira } from '../src/logica/carreiraPlano'
import { ATIVIDADES_CARREIRA, INICIO_PLANO, FIM_PLANO } from '../src/dados/carreiraPlanoSeed'

// Testa a LOGICA pura contra o plano de EXEMPLO (generico) que vem no codigo.
// O plano real do usuario e importado em tempo de execucao e fica so no aparelho.
const dia = (iso: string) => atividadesDoDia(iso, ATIVIDADES_CARREIRA, INICIO_PLANO, FIM_PLANO)
const ids = (iso: string) => dia(iso).map((a) => a.id)

describe('atividadesDoDia', () => {
  it('segunda 02/11 traz a rotina diaria e o ritual semanal de segunda', () => {
    const r = ids('2026-11-02')
    expect(r).toContain('ex-li-diario') // diaria, dia util
    expect(r).toContain('ex-sem-planejar') // semanal na segunda (diaSemana 1)
  })

  it('quarta 04/11 traz a sessao de candidaturas (semanal na quarta)', () => {
    const r = ids('2026-11-04')
    expect(r).toContain('ex-sem-candidaturas')
    expect(r).toContain('ex-li-diario')
  })

  it('quinta 05/11 traz o marco datado do dia', () => {
    const r = ids('2026-11-05')
    expect(r).toContain('ex-marco-perfil') // unica em 05/11
    expect(r).toContain('ex-li-diario')
  })

  it('forca a falha: domingo sem marco (29/11) nao traz NENHUMA atividade de carreira', () => {
    expect(dia('2026-11-29')).toHaveLength(0)
  })

  it('a rotina diaria nao aparece no domingo', () => {
    expect(ids('2026-11-29')).not.toContain('ex-li-diario')
  })

  it('fora da janela nao gera nada (antes do inicio e depois do fim)', () => {
    expect(dia('2026-10-31')).toHaveLength(0)
    expect(dia('2027-02-01')).toHaveLength(0)
  })

  it('cada entrega datada cai exatamente no seu dia', () => {
    expect(ids('2026-11-06')).toContain('ex-post-1')
    expect(ids('2026-11-06')).not.toContain('ex-marco-perfil')
  })
})

describe('progressoPlano', () => {
  it('conta so as entregas unicas, nada marcado = 0%', () => {
    const p = progressoPlano(ATIVIDADES_CARREIRA, new Set())
    expect(p.feitas).toBe(0)
    expect(p.total).toBeGreaterThan(0)
    expect(p.pct).toBe(0)
  })

  it('marcar uma entrega sobe o numero de feitas', () => {
    const feitos = new Set([chaveCarreira('ex-marco-perfil', '2026-11-05')])
    const p = progressoPlano(ATIVIDADES_CARREIRA, feitos)
    expect(p.feitas).toBe(1)
  })

  it('recorrente nao entra na conta de entregas', () => {
    const feitos = new Set([chaveCarreira('ex-li-diario', '2026-11-02')])
    const p = progressoPlano(ATIVIDADES_CARREIRA, feitos)
    expect(p.feitas).toBe(0)
  })
})

describe('porCategoria', () => {
  it('agrupa e nao devolve grupo vazio', () => {
    const grupos = porCategoria(ATIVIDADES_CARREIRA)
    expect(grupos.length).toBeGreaterThan(0)
    for (const g of grupos) expect(g.itens.length).toBeGreaterThan(0)
  })
})
