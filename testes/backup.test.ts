// E0: backup cobre todas as tabelas e a restauracao nao e destrutiva.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, semearSeNecessario } from '../src/db'
import { gerarBackup, restaurarBackup, validarBackup, BackupInvalido, type Backup } from '../src/utils/exportar'
import { criarVaga, prepararCandidatura } from '../src/servicos/candidaturas'
import { pedirArmazenamentoPersistente } from '../src/utils/armazenamento'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await semearSeNecessario()
})

async function popularTudo() {
  await db.carreiraPlano.add({ atividades: [], inicio: '2026-11-01', fim: '2027-01-31', importadoEm: 'x' })
  await db.planoProgresso.add({ chave: 'c1', valor: 'feito', atualizadoEm: 1 })
  await db.carreiraProgresso.add({ chave: 'a::2026-11-01', feito: true, atualizadoEm: 1 })
  const r = await criarVaga({ empresa: 'Acme', cargo: 'AI Engineer', url: 'https://acme.example/jobs/1' })
  await prepararCandidatura(r.vagaId)
  await db.respostasBase.add({ chave: 'r1', rotulo: 'R1', textoPt: 'x', confirmado: true })
  await db.perfilProfissional.add({ campos: [{ chave: 'k', valor: 'v', confirmado: true }], importadoEm: 1 })
}

async function fotografia(): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {}
  for (const t of db.tables) out[t.name] = await t.toArray()
  return out
}

describe('E0 backup', () => {
  it('cobre TODAS as tabelas do banco, inclusive carreiraPlano e as de candidaturas', async () => {
    const b = await gerarBackup()
    for (const t of db.tables) expect(Array.isArray(b[t.name]), `tabela ${t.name}`).toBe(true)
    for (const nome of ['carreiraPlano', 'vagas', 'candidaturas', 'eventosCandidatura', 'respostasBase', 'curriculos', 'perfilProfissional', 'logAcoes']) {
      expect(db.tables.map((t) => t.name)).toContain(nome)
      expect(Array.isArray(b[nome])).toBe(true)
    }
    expect(b.versao).toBe(db.verno)
    expect(b.versao).toBe(5)
  })

  it('IDA E VOLTA: exportar, bagunçar, restaurar e comparar todas as tabelas', async () => {
    await popularTudo()
    const antes = await fotografia()
    const arquivo = JSON.parse(JSON.stringify(await gerarBackup())) as Backup // passa pelo JSON como o arquivo real

    // Bagunca o banco: apaga tudo que tem e planta lixo.
    for (const t of db.tables) await t.clear()
    await db.metas.add({ titulo: 'lixo', alvo: 1, atual: 0, unidade: 'x', status: 'ativa' })

    await restaurarBackup(arquivo)
    const depois = await fotografia()
    expect(Object.keys(depois).sort()).toEqual(Object.keys(antes).sort())
    for (const nome of Object.keys(antes)) expect(depois[nome], `tabela ${nome}`).toEqual(antes[nome])
    expect(antes.candidaturas.length).toBeGreaterThan(0) // o teste nao e vazio
    expect(antes.carreiraPlano.length).toBeGreaterThan(0)
  })

  it('FORCA A FALHA: backup antigo (v3, sem tabelas novas) NAO apaga as tabelas ausentes', async () => {
    await popularTudo()
    const candidaturasAntes = await db.candidaturas.toArray()
    const vagasAntes = await db.vagas.toArray()
    const planoAntes = await db.carreiraPlano.toArray()
    const perfilAntes = await db.perfilProfissional.toArray()
    expect(candidaturasAntes.length).toBe(1)

    // Formato do backup antigo: versao 3, 12 tabelas, sem carreiraPlano e sem as de candidaturas.
    const antigo: Backup = {
      versao: 3, geradoEm: '2026-10-01T00:00:00.000Z',
      categorias: [{ id: 1, nome: 'X', cor: '#fff', icone: 'i', ordem: 0, sistema: false }],
      rotinas: [], excecoes: [], registrosBloco: [], tarefas: [], execucoes: [], resultados: [],
      metas: [], resumos: [], config: [{ id: 1, tema: 'escuro', notifInicioAtividade: false, notifProxima: false, notifAtraso: false, notifFechamento: false }],
      planoProgresso: [], carreiraProgresso: [],
    }
    await restaurarBackup(antigo)

    expect(await db.candidaturas.toArray()).toEqual(candidaturasAntes)
    expect(await db.vagas.toArray()).toEqual(vagasAntes)
    expect(await db.carreiraPlano.toArray()).toEqual(planoAntes)
    expect(await db.perfilProfissional.toArray()).toEqual(perfilAntes)
    expect(await db.eventosCandidatura.count()).toBeGreaterThan(0)
    // E o que estava no arquivo foi de fato restaurado:
    expect((await db.categorias.toArray()).map((c) => c.nome)).toEqual(['X'])
    expect((await db.config.toArray())[0].tema).toBe('escuro')
    expect(await db.rotinas.count()).toBe(0)
  })

  it('rejeita backup de versao mais nova sem tocar no banco', async () => {
    await popularTudo()
    const antes = await fotografia()
    await expect(restaurarBackup({ versao: 99, geradoEm: 'x', tarefas: [] })).rejects.toThrow(BackupInvalido)
    expect(await fotografia()).toEqual(antes)
  })

  it('rejeita arquivo invalido, sem versao ou sem tabela conhecida, sem tocar no banco', async () => {
    await popularTudo()
    const antes = await fotografia()
    for (const ruim of [null, 'texto', [], {}, { versao: 'a' }, { versao: 3 }, { versao: 3, coisa: [] }, { versao: 0, tarefas: [] }]) {
      await expect(restaurarBackup(ruim as unknown as Backup)).rejects.toThrow(BackupInvalido)
    }
    expect(await fotografia()).toEqual(antes)
  })

  it('restauracao e tudo ou nada: linha invalida desfaz tudo', async () => {
    await popularTudo()
    const antes = await fotografia()
    const ruim: Backup = {
      versao: 5, geradoEm: 'x',
      categorias: [{ id: 1, nome: 'A', cor: '#fff', icone: 'i', ordem: 0, sistema: false }],
      // chave duplicada em indice unico: o bulkAdd falha no meio
      respostasBase: [{ chave: 'dup', rotulo: 'a', textoPt: 'a', confirmado: true }, { chave: 'dup', rotulo: 'b', textoPt: 'b', confirmado: true }],
    }
    await expect(restaurarBackup(ruim)).rejects.toThrow()
    expect(await fotografia()).toEqual(antes)
  })

  it('validarBackup lista so as tabelas presentes', () => {
    expect(validarBackup({ versao: 3, tarefas: [], metas: [] }).sort()).toEqual(['metas', 'tarefas'])
  })

  it('armazenamento persistente: sem suporte devolve false e nao quebra', async () => {
    expect(await pedirArmazenamentoPersistente()).toBe(false) // Node nao tem navigator.storage
  })
})
