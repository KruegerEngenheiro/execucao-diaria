import { describe, it, expect } from 'vitest'
import { blocosDoDia } from '../src/logica/recorrencia'
import { ROTINA_SEED } from '../src/dados/rotinaSeed'
import type { Rotina, Excecao } from '../src/types'

// Monta rotinas com id a partir do seed.
const rotinas: Rotina[] = ROTINA_SEED.map((r, i) => ({ ...r, id: i + 1, ordem: i }))

// 2026-10-26 e uma segunda-feira. 2026-10-29 e quinta. 2026-10-31 e sabado. 2026-11-01 domingo.
describe('recorrencia da rotina semeada', () => {
  it('segunda tem a aula longa de ingles 20:30-21:30 como atividade da noite', () => {
    const b = blocosDoDia('2026-10-26', rotinas, [])
    const ingles = b.find((x) => x.titulo.includes('Ingles'))
    expect(ingles?.inicio).toBe('20:30')
    expect(ingles?.fim).toBe('21:30')
  })

  it('segunda nao tem bloco de projeto depois do ingles', () => {
    const b = blocosDoDia('2026-10-26', rotinas, [])
    const depois = b.filter((x) => x.inicioMin >= 1290) // depois de 21:30
    const temFoco = depois.some((x) => x.categoria === 'IA' || x.categoria === 'KRUEGER LABS')
    expect(temFoco).toBe(false)
  })

  it('terca tem ingles 20:00 e Krueger 20:30', () => {
    const b = blocosDoDia('2026-10-27', rotinas, [])
    expect(b.some((x) => x.titulo.includes('Ingles') && x.inicio === '20:00')).toBe(true)
    expect(b.some((x) => x.categoria === 'KRUEGER LABS' && x.inicio === '20:30')).toBe(true)
  })

  it('quinta nao tem academia', () => {
    const b = blocosDoDia('2026-10-29', rotinas, [])
    expect(b.some((x) => x.titulo === 'Academia')).toBe(false)
  })

  it('quinta tem dois blocos de foco de carreira (IA e Krueger)', () => {
    const b = blocosDoDia('2026-10-29', rotinas, [])
    expect(b.some((x) => x.categoria === 'IA' && x.inicio === '19:00')).toBe(true)
    expect(b.some((x) => x.categoria === 'KRUEGER LABS' && x.inicio === '20:30')).toBe(true)
  })

  it('dias uteis tem o sono bloqueado 21:30-22:30', () => {
    const b = blocosDoDia('2026-10-27', rotinas, [])
    expect(b.some((x) => x.janela === 'BLOQUEADO' && x.inicio === '21:30')).toBe(true)
  })

  it('sabado tem ingles 10h, academia 11h e projeto de IA 14h', () => {
    const b = blocosDoDia('2026-10-31', rotinas, [])
    expect(b.some((x) => x.titulo.includes('Ingles') && x.inicio === '10:00')).toBe(true)
    expect(b.some((x) => x.titulo === 'Academia' && x.inicio === '11:00')).toBe(true)
    expect(b.some((x) => x.categoria === 'IA' && x.inicio === '14:00')).toBe(true)
  })

  it('domingo e dia livre, sem rotina fixa', () => {
    const b = blocosDoDia('2026-11-01', rotinas, [])
    expect(b.length).toBe(0)
  })

  it('excecao de pular remove o bloco so naquele dia', () => {
    const idAcademiaTer = rotinas.find((r) => r.titulo === 'Academia' && r.dias.includes(2))!.id!
    const exc: Excecao[] = [{ rotinaId: idAcademiaTer, data: '2026-10-27', acao: 'pular' }]
    const comExc = blocosDoDia('2026-10-27', rotinas, exc)
    const semExc = blocosDoDia('2026-10-27', rotinas, [])
    expect(semExc.some((x) => x.titulo === 'Academia')).toBe(true)
    expect(comExc.some((x) => x.titulo === 'Academia')).toBe(false)
  })

  it('excecao de mover troca o horario', () => {
    const id = rotinas.find((r) => r.titulo === 'Academia' && r.dias.includes(2))!.id!
    const exc: Excecao[] = [{ rotinaId: id, data: '2026-10-27', acao: 'mover', novoInicio: '07:00', novoFim: '08:00' }]
    const b = blocosDoDia('2026-10-27', rotinas, exc)
    const ac = b.find((x) => x.titulo === 'Academia')
    expect(ac?.inicio).toBe('07:00')
  })
})
