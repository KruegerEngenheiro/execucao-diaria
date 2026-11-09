// Camada de dados. Dexie sobre IndexedDB. Tudo offline, no proprio aparelho.
// A camada e mantida limpa de proposito para permitir, no futuro, sincronizacao
// e backup (exportar/importar JSON) sem reescrever o app.
import Dexie, { type Table } from 'dexie'
import type {
  Categoria, Rotina, Excecao, RegistroBloco, Tarefa, Execucao,
  Resultado, Meta, ResumoDiario, Config, PlanoProgresso, CarreiraProgresso,
} from './types'
import { CATEGORIAS_SEED } from './dados/categoriasSeed'
import { ROTINA_SEED } from './dados/rotinaSeed'

export class BancoExecucao extends Dexie {
  categorias!: Table<Categoria, number>
  rotinas!: Table<Rotina, number>
  excecoes!: Table<Excecao, number>
  registrosBloco!: Table<RegistroBloco, number>
  tarefas!: Table<Tarefa, number>
  execucoes!: Table<Execucao, number>
  resultados!: Table<Resultado, number>
  metas!: Table<Meta, number>
  resumos!: Table<ResumoDiario, number>
  config!: Table<Config, number>
  planoProgresso!: Table<PlanoProgresso, number>
  carreiraProgresso!: Table<CarreiraProgresso, number>

  constructor() {
    super('execucao-diaria')
    this.version(1).stores({
      categorias: '++id, nome, ordem',
      rotinas: '++id, *dias, ativa, categoria',
      excecoes: '++id, rotinaId, data, [rotinaId+data]',
      registrosBloco: '++id, data, rotinaId, [data+rotinaId]',
      tarefas: '++id, status, data, prazo, categoria, metaId, prioridade',
      execucoes: '++id, tarefaId, data',
      resultados: '++id, tarefaId, data, categoria, metaId, tipo',
      metas: '++id, status, categoria',
      resumos: '++id, &data',
      config: '++id',
    })
    // Versao 2, aditiva: so acrescenta a store do Plano. Nao toca nas outras
    // nem nos dados ja gravados no aparelho.
    this.version(2).stores({
      planoProgresso: '++id, &chave',
    })
    // Versao 3, aditiva: so acrescenta a store do Plano de carreira de 90 dias.
    // Nao toca nas outras nem nos dados ja gravados no aparelho.
    this.version(3).stores({
      carreiraProgresso: '++id, &chave',
    })
  }
}

export const db = new BancoExecucao()

// Semeia categorias, rotina e config apenas na primeira vez.
export async function semearSeNecessario(): Promise<void> {
  try {
    await db.open()
  } catch (e) {
    // Se o IndexedDB estiver indisponivel, o app ainda carrega (so nao persiste).
    console.warn('Banco indisponivel, seguindo sem persistencia.', e)
    return
  }

  await db.transaction('rw', db.categorias, db.rotinas, db.config, async () => {
    const temCategorias = await db.categorias.count()
    if (temCategorias === 0) {
      await db.categorias.bulkAdd(CATEGORIAS_SEED as Categoria[])
    }

    const temRotina = await db.rotinas.count()
    if (temRotina === 0) {
      let ordem = 0
      const comOrdem = ROTINA_SEED.map((r) => ({ ...r, ordem: ordem++ }))
      await db.rotinas.bulkAdd(comOrdem as Rotina[])
    }

    const temConfig = await db.config.count()
    if (temConfig === 0) {
      await db.config.add({
        tema: 'sistema',
        notifInicioAtividade: false,
        notifProxima: false,
        notifAtraso: false,
        notifFechamento: false,
      })
    }
  })
}

export async function getConfig(): Promise<Config | undefined> {
  return db.config.toCollection().first()
}

export async function salvarConfig(patch: Partial<Config>): Promise<void> {
  const atual = await getConfig()
  if (atual?.id) await db.config.update(atual.id, patch)
}
