import { describe, it, expect } from 'vitest'
import { carreiraHoje } from '../src/logica/carreiraHoje'
import type { CursoPlano, ItemPerfil, PostPlano } from '../src/dados/planoSeed'

const curso = (chave: string): CursoPlano => ({ chave, nome: chave, destrava: 'x', alimenta: 'y' })
const item = (chave: string): ItemPerfil => ({ chave, texto: chave })
const post = (chave: string, numero: number, data: string): PostPlano => ({
  chave, numero, data, pilar: 'p', gancho: 'g', oQueFalar: ['a'], formato: 'f', cta: 'c',
})

const cursos = [curso('c1'), curso('c2')]
const itens = [item('i1'), item('i2')]
const posts = [post('post-1', 1, 'Ter 03/11'), post('post-2', 2, 'Qui 05/11')]

describe('carreiraHoje', () => {
  it('mostra o post de hoje quando nao publicado', () => {
    const r = carreiraHoje('2026-11-03', cursos, itens, posts, new Map())
    expect(r.postHoje?.chave).toBe('post-1')
  })

  it('exclui o post ja publicado e nao o conta como de hoje', () => {
    const r = carreiraHoje('2026-11-03', cursos, itens, posts, new Map([['post-1', 'feito']]))
    expect(r.postHoje).toBeUndefined()
    expect(r.proximoPost?.post.chave).toBe('post-2')
  })

  it('curso fazendo tem preferencia sobre o primeiro a fazer', () => {
    const r = carreiraHoje('2026-11-03', cursos, itens, posts, new Map([['c2', 'fazendo']]))
    expect(r.cursoFoco?.chave).toBe('c2')
  })

  it('sem fazendo, pega o primeiro curso nao feito', () => {
    const r = carreiraHoje('2026-11-03', cursos, itens, posts, new Map([['c1', 'feito']]))
    expect(r.cursoFoco?.chave).toBe('c2')
  })

  it('proximoPost conta os dias certo', () => {
    const r = carreiraHoje('2026-11-01', cursos, itens, posts, new Map())
    expect(r.postHoje).toBeUndefined()
    expect(r.proximoPost?.post.chave).toBe('post-1')
    expect(r.proximoPost?.emDias).toBe(2)
  })

  it('proximo item de perfil e o primeiro nao marcado', () => {
    const r = carreiraHoje('2026-11-03', cursos, itens, posts, new Map([['i1', 'feito']]))
    expect(r.proximoPerfil?.chave).toBe('i2')
  })

  it('plano vazio nao quebra', () => {
    const r = carreiraHoje('2026-11-03', [], [], [], new Map())
    expect(r.planoEmDia).toBe(true)
    expect(r.postHoje).toBeUndefined()
    expect(r.cursoFoco).toBeUndefined()
  })

  it('plano todo feito fica em dia', () => {
    const prog = new Map([
      ['c1', 'feito'], ['c2', 'feito'], ['i1', 'feito'], ['i2', 'feito'],
      ['post-1', 'feito'], ['post-2', 'feito'],
    ])
    const r = carreiraHoje('2026-11-03', cursos, itens, posts, prog)
    expect(r.planoEmDia).toBe(true)
    expect(r.cursoFoco).toBeUndefined()
    expect(r.proximoPerfil).toBeUndefined()
    expect(r.proximoPost).toBeUndefined()
  })

  it('forca a falha: data sem post nao vira post de hoje', () => {
    const r = carreiraHoje('2026-11-04', cursos, itens, posts, new Map())
    expect(r.postHoje).toBeUndefined()
  })
})
