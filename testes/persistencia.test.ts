// Testes de persistencia e fluxo de ponta a ponta usando fake-indexeddb.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, semearSeNecessario } from '../src/db'
import {
  criarTarefa, iniciarTimer, pausarTimer, concluirTarefa, reagendarTarefa,
  cancelarTarefa, adicionarResultado, criarMeta, fecharDia, resumoDaData, marcarBloco,
} from '../src/servicos'
import { hojeISO } from '../src/utils/datas'

const HOJE = hojeISO()

beforeEach(async () => {
  await db.delete()
  await db.open()
  await semearSeNecessario()
})

describe('persistencia e fluxo', () => {
  it('semeia categorias e rotina na primeira vez', async () => {
    expect(await db.categorias.count()).toBeGreaterThan(10)
    expect(await db.rotinas.count()).toBeGreaterThan(10)
    expect(await db.config.count()).toBe(1)
  })

  it('CENARIO: criar, iniciar, pausar, concluir uma tarefa', async () => {
    const id = await criarTarefa({ titulo: 'Proposta', categoria: 'KRUEGER LABS', prioridade: 'ALTA', data: HOJE, duracaoEstimada: 30 })
    await iniciarTimer(id)
    let t = await db.tarefas.get(id)
    expect(t?.status).toBe('em_andamento')
    await pausarTimer(id)
    t = await db.tarefas.get(id)
    expect(t?.status).toBe('pausada')
    expect(t!.tempoAcumuladoMs).toBeGreaterThanOrEqual(0)
    await concluirTarefa(id)
    t = await db.tarefas.get(id)
    expect(t?.status).toBe('concluida')
    expect(t?.concluidoEm).toBeTruthy()
  })

  it('CENARIO: concluir com resultado atualiza a meta ligada', async () => {
    const metaId = await criarMeta({ titulo: '10 clientes', alvo: 10, unidade: 'clientes', tipoResultado: 'quantidade' })
    const id = await criarTarefa({ titulo: 'Prospectar', categoria: 'KRUEGER LABS', prioridade: 'MEDIA', data: HOJE, duracaoEstimada: 30, metaId })
    await concluirTarefa(id, { tipo: 'quantidade', valor: 3, metaId })
    const meta = await db.metas.get(metaId)
    expect(meta?.atual).toBe(3)
  })

  it('CENARIO: so um cronometro corre por vez', async () => {
    const a = await criarTarefa({ titulo: 'A', categoria: 'IA', prioridade: 'MEDIA', data: HOJE, duracaoEstimada: 30 })
    const b = await criarTarefa({ titulo: 'B', categoria: 'IA', prioridade: 'MEDIA', data: HOJE, duracaoEstimada: 30 })
    await iniciarTimer(a)
    await iniciarTimer(b)
    const ta = await db.tarefas.get(a)
    const tb = await db.tarefas.get(b)
    expect(ta?.status).toBe('pausada')
    expect(tb?.status).toBe('em_andamento')
  })

  it('CENARIO: reagendar e cancelar', async () => {
    const id = await criarTarefa({ titulo: 'X', categoria: 'Outros', prioridade: 'BAIXA', data: HOJE, duracaoEstimada: 30 })
    await reagendarTarefa(id, '2026-12-01')
    expect((await db.tarefas.get(id))?.status).toBe('pendente')
    expect((await db.tarefas.get(id))?.data).toBe('2026-12-01')
    const id2 = await criarTarefa({ titulo: 'Y', categoria: 'Outros', prioridade: 'BAIXA', data: HOJE, duracaoEstimada: 30 })
    await cancelarTarefa(id2)
    expect((await db.tarefas.get(id2))?.status).toBe('cancelada')
  })

  it('CENARIO: fechar o dia gera resumo com score e preserva historico', async () => {
    const id = await criarTarefa({ titulo: 'Tarefa', categoria: 'IA', prioridade: 'ALTA', data: HOJE, duracaoEstimada: 30 })
    await concluirTarefa(id)
    await adicionarResultado({ tipo: 'entrega', valor: 1, descricao: 'Feito', data: HOJE })
    const resumo = await fecharDia(HOJE, { conquistas: 'Entreguei', aprendi: '', melhorar: '' })
    expect(resumo.tarefasConcluidas).toBe(1)
    expect(resumo.score).toBeGreaterThan(0)
    const lido = await resumoDaData(HOJE)
    expect(lido?.conquistas).toBe('Entreguei')
  })

  it('CENARIO: marcar bloco de foco persiste', async () => {
    const rotinaFoco = await db.rotinas.filter((r) => r.janela === 'FOCO').first()
    await marcarBloco(HOJE, rotinaFoco!.id!, 'feito')
    const reg = await db.registrosBloco.where('[data+rotinaId]').equals([HOJE, rotinaFoco!.id!]).first()
    expect(reg?.status).toBe('feito')
  })

  it('CENARIO: dados sobrevivem a reabertura do banco', async () => {
    const id = await criarTarefa({ titulo: 'Persistente', categoria: 'Outros', prioridade: 'MEDIA', data: HOJE, duracaoEstimada: 30 })
    db.close()
    await db.open()
    const achou = await db.tarefas.get(id)
    expect(achou?.titulo).toBe('Persistente')
  })

  it('semear duas vezes nao duplica', async () => {
    const antes = await db.rotinas.count()
    await semearSeNecessario()
    const depois = await db.rotinas.count()
    expect(depois).toBe(antes)
  })
})
