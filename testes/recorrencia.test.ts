import { describe, it, expect } from 'vitest'
import { blocosDoDia } from '../src/logica/recorrencia'
import { ROTINA_SEED } from '../src/dados/rotinaSeed'
import type { Rotina, Excecao } from '../src/types'

// Monta rotinas com id a partir do seed (de exemplo, generico).
const rotinas: Rotina[] = ROTINA_SEED.map((r, i) => ({ ...r, id: i + 1, ordem: i }))

// 2026-10-26 e uma segunda-feira. 2026-10-27 terca. 2026-10-29 quinta.
// 2026-10-31 sabado. 2026-11-01 domingo.
describe('recorrencia da rotina semeada', () => {
  it('segunda tem a aula de idioma 20:30-21:30 como atividade da noite', () => {
    const b = blocosDoDia('2026-10-26', rotinas, [])
    const idioma = b.find((x) => x.titulo.includes('idioma'))
    expect(idioma?.inicio).toBe('20:30')
    expect(idioma?.fim).toBe('21:30')
  })

  it('segunda nao tem bloco de projeto depois do idioma', () => {
    const b = blocosDoDia('2026-10-26', rotinas, [])
    const depois = b.filter((x) => x.inicioMin >= 1290) // depois de 21:30
    const temFoco = depois.some((x) => x.categoria === 'Projetos' || x.categoria === 'Estudo')
    expect(temFoco).toBe(false)
  })

  it('terca tem idioma 20:00 e projeto pessoal 20:30', () => {
    const b = blocosDoDia('2026-10-27', rotinas, [])
    expect(b.some((x) => x.titulo.includes('idioma') && x.inicio === '20:00')).toBe(true)
    expect(b.some((x) => x.categoria === 'Projetos' && x.inicio === '20:30')).toBe(true)
  })

  it('quinta nao tem exercicio', () => {
    const b = blocosDoDia('2026-10-29', rotinas, [])
    expect(b.some((x) => x.titulo === 'Exercicio')).toBe(false)
  })

  it('quinta tem estudo 19:00 e projeto 20:30', () => {
    const b = blocosDoDia('2026-10-29', rotinas, [])
    expect(b.some((x) => x.categoria === 'Estudo' && x.inicio === '19:00')).toBe(true)
    expect(b.some((x) => x.categoria === 'Projetos' && x.inicio === '20:30')).toBe(true)
  })

  it('dias uteis tem o sono bloqueado 21:30-22:30', () => {
    const b = blocosDoDia('2026-10-27', rotinas, [])
    expect(b.some((x) => x.janela === 'BLOQUEADO' && x.inicio === '21:30')).toBe(true)
  })

  it('sabado tem idioma 10h, exercicio 11h e projeto 14h', () => {
    const b = blocosDoDia('2026-10-31', rotinas, [])
    expect(b.some((x) => x.titulo.includes('idioma') && x.inicio === '10:00')).toBe(true)
    expect(b.some((x) => x.titulo === 'Exercicio' && x.inicio === '11:00')).toBe(true)
    expect(b.some((x) => x.categoria === 'Projetos' && x.inicio === '14:00')).toBe(true)
  })

  it('domingo e dia livre, sem rotina fixa', () => {
    const b = blocosDoDia('2026-11-01', rotinas, [])
    expect(b.length).toBe(0)
  })

  it('excecao de pular remove o bloco so naquele dia', () => {
    const idExercicioTer = rotinas.find((r) => r.titulo === 'Exercicio' && r.dias.includes(2))!.id!
    const exc: Excecao[] = [{ rotinaId: idExercicioTer, data: '2026-10-27', acao: 'pular' }]
    const comExc = blocosDoDia('2026-10-27', rotinas, exc)
    const semExc = blocosDoDia('2026-10-27', rotinas, [])
    expect(semExc.some((x) => x.titulo === 'Exercicio')).toBe(true)
    expect(comExc.some((x) => x.titulo === 'Exercicio')).toBe(false)
  })

  it('excecao de mover troca o horario', () => {
    const id = rotinas.find((r) => r.titulo === 'Exercicio' && r.dias.includes(2))!.id!
    const exc: Excecao[] = [{ rotinaId: id, data: '2026-10-27', acao: 'mover', novoInicio: '07:00', novoFim: '08:00' }]
    const b = blocosDoDia('2026-10-27', rotinas, exc)
    const ac = b.find((x) => x.titulo === 'Exercicio')
    expect(ac?.inicio).toBe('07:00')
  })
})
