// Endurecimento pos-QA (E0+E1): restore revalida regras, meta reconta, evidencia literal etc.
// Cada teste tem controle positivo (caso valido passa) e caso que forca a falha.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db, semearSeNecessario } from '../src/db'
import { gerarBackup, restaurarBackup, prepararRestauracao, avisosDeGrupo, baixarBackup, BackupInvalido, type Backup } from '../src/utils/exportar'
import {
  criarVaga, prepararCandidatura, editarCandidatura, aprovarCandidatura, registrarEnvio, registrarMarco,
  criarMetaEntrevistas, importarPerfil, RegraViolada, TITULO_META_ENTREVISTAS,
} from '../src/servicos/candidaturas'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await semearSeNecessario()
})

const curriculo = async () => (await db.curriculos.where('chave').equals('EN-internacional').first())!.id!
async function enviada(url = 'https://acme.example/jobs/1') {
  const { vagaId } = await criarVaga({ empresa: 'Acme', cargo: 'AI Engineer', url })
  const id = await prepararCandidatura(vagaId, { curriculoId: await curriculo() })
  await aprovarCandidatura(id)
  await registrarEnvio(id)
  return { vagaId, id }
}
async function fotografia() {
  const out: Record<string, unknown[]> = {}
  for (const t of db.tables) out[t.name] = await t.toArray()
  return out
}
const rejeita = (p: Promise<unknown>) => expect(p).rejects.toThrow(RegraViolada)

describe('P2-1 restore revalida regras', () => {
  const agora = Date.now()
  const base = { vagaId: 1, respostas: [], camposPendentes: [], criadoEm: agora, atualizadoEm: agora }
  const vagaOk = { id: 1, chaveDedup: 'k', empresa: 'A', cargo: 'B', elegibilidade: 'desconhecida', status: 1, criadoEm: agora, atualizadoEm: agora }

  it('controle: backup coerente (gerado pelo proprio app) restaura', async () => {
    await enviada()
    const arq = JSON.parse(JSON.stringify(await gerarBackup())) as unknown as Backup
    await expect(restaurarBackup(arq)).resolves.toBeTruthy()
  })
  it('REJEITA "Enviada" forjada: sem aprovadaEm, sem evento, vaga orfa', async () => {
    const antes = await fotografia()
    const forjado = { versao: 5, candidaturas: [{ ...base, vagaId: 999, status: 5, enviadaEm: agora }] } as unknown as Backup
    await expect(restaurarBackup(forjado)).rejects.toThrow(BackupInvalido)
    expect(await fotografia()).toEqual(antes)
  })
  it('REJEITA enviada com vaga existente mas sem aprovacao ou sem evento de envio', async () => {
    const semAprov = { versao: 5, vagas: [vagaOk], candidaturas: [{ ...base, id: 1, status: 5, enviadaEm: agora }], eventosCandidatura: [] } as unknown as Backup
    await expect(restaurarBackup(semAprov)).rejects.toThrow(/aprovacao/)
    const semEvento = { versao: 5, vagas: [vagaOk], candidaturas: [{ ...base, id: 1, status: 5, aprovadaEm: agora, enviadaEm: agora }], eventosCandidatura: [] } as unknown as Backup
    await expect(restaurarBackup(semEvento)).rejects.toThrow(/evento de envio/)
    const completo = { ...semEvento, eventosCandidatura: [{ id: 1, candidaturaId: 1, tipo: 'envio', em: agora }] } as unknown as Backup
    await expect(restaurarBackup(completo)).resolves.toContain('candidaturas') // controle: com tudo, passa
  })
  it('REJEITA respostasBase confirmada sem texto (forjada) e resposta "base" que nao bate', async () => {
    await expect(restaurarBackup({ versao: 5, respostasBase: [{ chave: 'x', rotulo: 'x', confirmado: true }] } as unknown as Backup)).rejects.toThrow(BackupInvalido)
    await expect(restaurarBackup({ versao: 5, respostasBase: [{ chave: 'x', rotulo: 'x', confirmado: 'sim', textoPt: 'a' }] } as unknown as Backup)).rejects.toThrow(BackupInvalido)
    const forjada = {
      versao: 5, vagas: [vagaOk],
      candidaturas: [{ ...base, id: 1, status: 3, respostas: [{ pergunta: 'p', texto: 'invento', origem: 'base', confirmado: true }] }],
    } as unknown as Backup
    await expect(restaurarBackup(forjada)).rejects.toThrow(/central de dados/)
    const certa = {
      ...forjada, respostasBase: [{ chave: 'x', rotulo: 'x', textoPt: 'invento', confirmado: true }],
    } as unknown as Backup
    await expect(restaurarBackup(certa)).resolves.toBeTruthy() // controle
  })
  it('REJEITA linha que nao e objeto, tipos errados e vaga restaurada deixando candidatura orfa', async () => {
    await expect(restaurarBackup({ versao: 5, candidaturas: [null] } as unknown as Backup)).rejects.toThrow(BackupInvalido)
    await expect(restaurarBackup({ versao: 5, vagas: [{ ...vagaOk, status: 99 }] } as unknown as Backup)).rejects.toThrow(BackupInvalido)
    await expect(restaurarBackup({ versao: 5, vagas: [{ ...vagaOk, elegibilidade: 'remote_brazil' }] } as unknown as Backup)).rejects.toThrow(/evidencia/)
    await enviada()
    const antes = await fotografia()
    await expect(restaurarBackup({ versao: 5, vagas: [] } as unknown as Backup)).rejects.toThrow(/vaga que nao existe/)
    expect(await fotografia()).toEqual(antes)
  })
  it('erro cru do Dexie vira mensagem curta em portugues e nada muda', async () => {
    const antes = await fotografia()
    const dup = { versao: 5, respostasBase: [{ chave: 'd', rotulo: 'a', textoPt: 'a', confirmado: true }, { chave: 'd', rotulo: 'b', textoPt: 'b', confirmado: true }] } as unknown as Backup
    const e = await restaurarBackup(dup).catch((x) => x)
    expect(e).toBeInstanceOf(BackupInvalido)
    expect(e.message).toMatch(/Nada foi alterado/)
    expect(e.message).not.toMatch(/Cannot|Constraint|\bin\b operator/i)
    expect(await fotografia()).toEqual(antes)
  })
  it('prepararRestauracao (usada pela tela) tambem recusa o forjado e devolve avisos de grupo', async () => {
    await expect(prepararRestauracao({ versao: 5, candidaturas: [{ ...base, vagaId: 999, status: 5, enviadaEm: agora }] })).rejects.toThrow(BackupInvalido)
    const r = await prepararRestauracao({ versao: 3, metas: [], resultados: [] })
    expect(r.avisos.join(' ')).toMatch(/metas e candidaturas/i)
  })
})

describe('P2-2 meta de entrevistas apos restore parcial', () => {
  it('backup v3 (metas vazias) + candidatura com entrevistaContadaEm: recriar a meta reconta (nao fica 0)', async () => {
    await criarMetaEntrevistas(3)
    const { id } = await enviada()
    await registrarMarco(id, 'entrevista')
    expect((await db.candidaturas.get(id))?.entrevistaContadaEm).toBeTruthy()
    // Restaura SO metas e resultados vazios (como um backup v3 de antes da meta existir).
    await restaurarBackup({ versao: 3, geradoEm: 'x', metas: [], resultados: [] })
    expect(await db.metas.count()).toBe(0)
    expect((await db.candidaturas.get(id))?.entrevistaContadaEm).toBeTruthy() // marca velha ficou
    await criarMetaEntrevistas(3)
    const meta = await db.metas.filter((m) => m.titulo === TITULO_META_ENTREVISTAS).first()
    expect(meta?.atual).toBe(1)
  })
  it('avisosDeGrupo avisa quando um grupo vem sem o outro, e nao avisa no backup completo', () => {
    expect(avisosDeGrupo(['metas', 'resultados']).length).toBeGreaterThan(0)
    expect(avisosDeGrupo(['candidaturas']).length).toBeGreaterThan(0)
    expect(avisosDeGrupo(['tarefas'])).toEqual([])
    expect(avisosDeGrupo(db.tables.map((t) => t.name))).toEqual([])
  })
})

describe('P3-1 evidencia de elegibilidade literal', () => {
  const N = { empresa: 'Acme', cargo: 'AI Engineer', url: 'https://acme.example/jobs/9' }
  it('REJEITA evidencia que nao aparece na descricao (reproduzido: onsite Berlin + "x")', async () => {
    await rejeita(criarVaga({ ...N, descricao: 'onsite only in Berlin', elegibilidade: 'remote_worldwide', elegibilidadeEvidencia: 'x' }))
    await rejeita(criarVaga({ ...N, descricao: 'onsite only in Berlin', elegibilidade: 'remote_worldwide', elegibilidadeEvidencia: 'fully remote worldwide' }))
  })
  it('aceita trecho literal (ignora caixa, acento e espacos)', async () => {
    const r = await criarVaga({ ...N, descricao: 'We are hiring.\nOpen to  candidates in Brazil, remote.', elegibilidade: 'remote_brazil', elegibilidadeEvidencia: 'open to candidates in brazil' })
    expect(r.criada).toBe(true)
    expect((await db.vagas.get(r.vagaId))?.alertas).toEqual([])
  })
  it('sem descricao: exige tamanho minimo e marca "sem fonte colada"', async () => {
    await rejeita(criarVaga({ ...N, elegibilidade: 'remote_brazil', elegibilidadeEvidencia: 'x' }))
    const r = await criarVaga({ ...N, elegibilidade: 'remote_brazil', elegibilidadeEvidencia: 'Open to candidates in Brazil' })
    expect((await db.vagas.get(r.vagaId))?.alertas.join(' ')).toMatch(/sem fonte colada/i)
  })
})

describe('P3-2 flag qualificada gravada no evento', () => {
  it('entrevista nao qualificada fica marcada e a meta retroativa NAO a conta', async () => {
    const a = await enviada()
    await registrarMarco(a.id, 'entrevista', { qualificada: false })
    const ev = await db.eventosCandidatura.where({ candidaturaId: a.id, tipo: 'entrevista' }).first()
    expect(ev?.qualificada).toBe(false)
    const b = await enviada('https://acme.example/jobs/2')
    await registrarMarco(b.id, 'entrevista')
    expect((await db.eventosCandidatura.where({ candidaturaId: b.id, tipo: 'entrevista' }).first())?.qualificada).toBe(true)
    await criarMetaEntrevistas(5)
    const meta = await db.metas.filter((m) => m.titulo === TITULO_META_ENTREVISTAS).first()
    expect(meta?.atual).toBe(1) // so a qualificada
  })
})

describe('P3-3 origem de resposta', () => {
  it('REJEITA origem fora de base ou manual; aceita manual', async () => {
    const { vagaId } = await criarVaga({ empresa: 'Acme', cargo: 'AI Engineer', url: 'https://acme.example/jobs/3' })
    const id = await prepararCandidatura(vagaId, { curriculoId: await curriculo() })
    for (const origem of ['zzz', 'ia']) {
      await rejeita(editarCandidatura(id, { respostas: [{ pergunta: 'p', texto: 't', origem: origem as 'manual', confirmado: true }] }))
    }
    await editarCandidatura(id, { respostas: [{ pergunta: 'p', texto: 't', origem: 'manual', confirmado: true }] })
    expect((await db.candidaturas.get(id))?.respostas).toHaveLength(1)
  })
})

describe('P4 menores', () => {
  it('P4-5: reenvio com outra chave recusa mas NAO polui a auditoria com envio_recusado', async () => {
    const { id } = await enviada()
    const antes = await db.logAcoes.where('tipo').equals('envio_recusado').count()
    await rejeita(registrarEnvio(id, { idempotencyKey: 'OUTRA' }))
    expect(await db.logAcoes.where('tipo').equals('envio_recusado').count()).toBe(antes)
    // controle: recusa real (nunca aprovada) CONTINUA registrada
    const { vagaId } = await criarVaga({ empresa: 'Beta', cargo: 'LLM Engineer', url: 'https://beta.example/1' })
    const id2 = await prepararCandidatura(vagaId, { curriculoId: await curriculo() })
    await rejeita(registrarEnvio(id2))
    expect(await db.logAcoes.where('tipo').equals('envio_recusado').count()).toBe(antes + 1)
  })
  it('P4-4: curriculo com chave valida mas ausente no aparelho gera aviso, nao silencio', async () => {
    const c = await db.curriculos.where('chave').equals('PT-brasil').first()
    await db.curriculos.delete(c!.id!)
    const r = await importarPerfil({ curriculos: [{ chave: 'PT-brasil', versao: 'v1' }, { chave: 'EN-internacional', versao: 'v2' }] })
    expect(r.avisos.join(' ')).toMatch(/PT-brasil/)
    expect(r.avisos.join(' ')).not.toMatch(/EN-internacional/)
  })
  it('P4-2: o download so revoga a URL depois de um atraso (iOS Safari)', async () => {
    const click = vi.fn()
    const revoke = vi.fn()
    const agendados: Array<() => void> = []
    vi.stubGlobal('document', { createElement: () => ({ click }) })
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: revoke })
    vi.stubGlobal('Blob', class { constructor(public p: unknown[]) {} })
    vi.stubGlobal('setTimeout', (fn: () => void) => { agendados.push(fn); return 0 })
    try {
      await baixarBackup()
      expect(click).toHaveBeenCalledTimes(1)
      expect(revoke).not.toHaveBeenCalled() // antes: revogava na hora
      agendados.forEach((f) => f())
      expect(revoke).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
