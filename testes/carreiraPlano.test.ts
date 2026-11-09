import { describe, it, expect } from 'vitest'
import { atividadesDoDia, progressoPlano, porCategoria, chaveCarreira } from '../src/logica/carreiraPlano'
import { ATIVIDADES_CARREIRA, INICIO_PLANO, FIM_PLANO } from '../src/dados/carreiraPlanoSeed'

const dia = (iso: string) => atividadesDoDia(iso, ATIVIDADES_CARREIRA, INICIO_PLANO, FIM_PLANO)
const ids = (iso: string) => dia(iso).map((a) => a.id)

describe('atividadesDoDia', () => {
  it('terca 03/11 traz a rotina diaria, o post do dia e os marcos da data', () => {
    const r = ids('2026-11-03')
    expect(r).toContain('li-diario') // diaria, dia util
    expect(r).toContain('post-c1') // post datado em 03/11
    expect(r).toContain('li-about') // marco P0 em 03/11
    expect(r).toContain('gh-auditar') // marco P0 em 03/11
    expect(r).toContain('sem-codigo') // semanal na terca
  })

  it('quarta 04/11 traz a sessao de candidaturas (semanal na quarta)', () => {
    const r = ids('2026-11-04')
    expect(r).toContain('sem-candidaturas')
    expect(r).toContain('li-diario')
  })

  it('primeiro dia do mes (01/12) traz as mensais', () => {
    const r = ids('2026-12-01')
    expect(r).toContain('mes-metas')
    expect(r).toContain('mes-destaques')
    expect(r).toContain('mes-cv')
  })

  it('forca a falha: domingo sem marco (29/11) nao traz NENHUMA atividade de carreira', () => {
    expect(dia('2026-11-29')).toHaveLength(0)
  })

  it('a rotina diaria nao aparece no domingo', () => {
    expect(ids('2026-11-29')).not.toContain('li-diario')
  })

  it('fora da janela nao gera nada (antes do inicio e depois do fim)', () => {
    expect(dia('2026-10-31')).toHaveLength(0)
    expect(dia('2027-02-01')).toHaveLength(0)
  })

  it('cada post datado cai exatamente no seu dia', () => {
    expect(ids('2026-11-05')).toContain('post-c2')
    expect(ids('2026-11-05')).not.toContain('post-c1')
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
    const feitos = new Set([chaveCarreira('li-about', '2026-11-03')])
    const p = progressoPlano(ATIVIDADES_CARREIRA, feitos)
    expect(p.feitas).toBe(1)
  })

  it('recorrente nao entra na conta de entregas', () => {
    const feitos = new Set([chaveCarreira('li-diario', '2026-11-03')])
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
