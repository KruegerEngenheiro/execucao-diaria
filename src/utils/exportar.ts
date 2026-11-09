// Exportacao e importacao de backup em JSON.
// Base para a fase futura de backup e sincronizacao, ja utilizavel hoje.
import { db } from '../db'

export interface Backup {
  versao: number
  geradoEm: string
  categorias: unknown[]
  rotinas: unknown[]
  excecoes: unknown[]
  registrosBloco: unknown[]
  tarefas: unknown[]
  execucoes: unknown[]
  resultados: unknown[]
  metas: unknown[]
  resumos: unknown[]
  config: unknown[]
  planoProgresso?: unknown[]
  carreiraProgresso?: unknown[]
}

export async function gerarBackup(): Promise<Backup> {
  const [
    categorias, rotinas, excecoes, registrosBloco, tarefas,
    execucoes, resultados, metas, resumos, config, planoProgresso, carreiraProgresso,
  ] = await Promise.all([
    db.categorias.toArray(), db.rotinas.toArray(), db.excecoes.toArray(),
    db.registrosBloco.toArray(), db.tarefas.toArray(), db.execucoes.toArray(),
    db.resultados.toArray(), db.metas.toArray(), db.resumos.toArray(), db.config.toArray(),
    db.planoProgresso.toArray(), db.carreiraProgresso.toArray(),
  ])
  return {
    versao: 3,
    geradoEm: new Date().toISOString(),
    categorias, rotinas, excecoes, registrosBloco, tarefas,
    execucoes, resultados, metas, resumos, config, planoProgresso, carreiraProgresso,
  }
}

export async function baixarBackup(): Promise<void> {
  const backup = await gerarBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `execucao-backup-${backup.geradoEm.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Restauracao: substitui tudo pelo conteudo do backup.
export async function restaurarBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.categorias.bulkAdd(backup.categorias as any)
    await db.rotinas.bulkAdd(backup.rotinas as any)
    await db.excecoes.bulkAdd(backup.excecoes as any)
    await db.registrosBloco.bulkAdd(backup.registrosBloco as any)
    await db.tarefas.bulkAdd(backup.tarefas as any)
    await db.execucoes.bulkAdd(backup.execucoes as any)
    await db.resultados.bulkAdd(backup.resultados as any)
    await db.metas.bulkAdd(backup.metas as any)
    await db.resumos.bulkAdd(backup.resumos as any)
    await db.config.bulkAdd(backup.config as any)
    await db.planoProgresso.bulkAdd((backup.planoProgresso ?? []) as any)
    await db.carreiraProgresso.bulkAdd((backup.carreiraProgresso ?? []) as any)
  })
}
