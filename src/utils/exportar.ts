// Exportacao e importacao de backup em JSON.
// Cobre TODAS as tabelas do banco (lidas de db.tables, entao tabela nova entra
// sozinha no backup). A restauracao NUNCA limpa o banco inteiro: so as tabelas
// que existem no arquivo, e so depois de validar o arquivo.
import { db } from '../db'

// Backup e um objeto plano: versao, geradoEm e uma lista por tabela. O formato
// plano e o mesmo dos backups antigos, que continuam restauraveis.
export interface Backup {
  versao: number
  geradoEm: string
  [tabela: string]: unknown
}

export async function gerarBackup(): Promise<Backup> {
  const backup: Backup = { versao: db.verno, geradoEm: new Date().toISOString() }
  // Leitura consistente: todas as tabelas no mesmo instante.
  await db.transaction('r', db.tables, async () => {
    for (const t of db.tables) backup[t.name] = await t.toArray()
  })
  return backup
}

export async function baixarBackup(): Promise<void> {
  const backup = await gerarBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `execucao-backup-${backup.geradoEm.slice(0, 10)}.json`
  a.click()
  // iOS Safari pode cancelar o download se o link for revogado na hora.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export class BackupInvalido extends Error {}

// Valida o arquivo ANTES de tocar no banco. Devolve as tabelas que serao restauradas.
export function validarBackup(backup: unknown): string[] {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new BackupInvalido('Arquivo de backup invalido.')
  }
  const b = backup as Record<string, unknown>
  if (typeof b.versao !== 'number' || !Number.isFinite(b.versao) || b.versao < 1) {
    throw new BackupInvalido('Backup sem versao valida.')
  }
  if (b.versao > db.verno) {
    throw new BackupInvalido('Esse backup e de uma versao mais nova do app. Atualize o app antes de restaurar.')
  }
  const presentes = db.tables.map((t) => t.name).filter((n) => Array.isArray(b[n]))
  if (presentes.length === 0) {
    throw new BackupInvalido('O backup nao tem nenhuma tabela conhecida.')
  }
  return presentes
}

// ---------------------------------------------------------------------------
// Validacao de CONTEUDO por tabela. O restore e o unico caminho que escreve
// direto no banco, entao ele revalida as regras que o servico garante: nao da
// para forjar "enviada" sem aprovacao, nem resposta "confirmada" falsa, nem
// candidatura orfa. Roda ANTES de tocar no banco.
// ---------------------------------------------------------------------------
type Linha = Record<string, unknown>
const invalido = (m: string): never => { throw new BackupInvalido(m) }
const ehObj = (x: unknown): x is Linha => !!x && typeof x === 'object' && !Array.isArray(x)
const ehNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const ehTxt = (x: unknown): x is string => typeof x === 'string'
const temTxt = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0

const ELEG = ['remote_brazil', 'remote_latam', 'remote_americas', 'remote_worldwide', 'remote_us_only', 'hybrid', 'onsite', 'desconhecida']
const EVENTOS = ['criada', 'editada', 'aprovada', 'aprovacao_revogada', 'adiada', 'envio', 'avaliacao', 'entrevista',
  'teste_tecnico', 'contato_recrutador', 'aprovado', 'rejeicao', 'encerrada', 'followup', 'nota', 'status']
const statusOk = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 11

// Avisos (nao bloqueiam) sobre grupos restaurados pela metade.
export function avisosDeGrupo(tabelas: string[]): string[] {
  const t = new Set(tabelas)
  const out: string[] = []
  const cand = ['vagas', 'candidaturas', 'eventosCandidatura'].filter((n) => t.has(n))
  if (cand.length > 0 && cand.length < 3) {
    out.push('O arquivo tem so parte das tabelas de candidaturas. As outras ficam como estao e podem nao combinar com o que for restaurado.')
  }
  const meta = ['metas', 'resultados'].filter((n) => t.has(n))
  if (meta.length === 1) out.push('O arquivo tem so metas ou so resultados. A meta de entrevistas pode ficar com a contagem errada.')
  if (t.has('metas') !== t.has('candidaturas')) {
    out.push('Metas e candidaturas vem de arquivos diferentes: a contagem da meta "Entrevistas qualificadas" pode divergir. Se a meta for recriada, ela reconta pelas entrevistas registradas.')
  }
  return out
}

export async function validarConteudo(backup: Backup, nomes: string[]): Promise<void> {
  const tem = (n: string) => nomes.includes(n)
  const linhasDe = async (n: string): Promise<Linha[]> =>
    (tem(n) ? (backup[n] as unknown[]) : await db.table(n).toArray()) as Linha[]

  // 1) Toda linha de toda tabela presente precisa ser um objeto.
  for (const n of nomes) {
    ;(backup[n] as unknown[]).forEach((l, i) => { if (!ehObj(l)) invalido(`Backup invalido: ${n}[${i}] nao e um registro.`) })
  }
  if (!['vagas', 'candidaturas', 'eventosCandidatura', 'respostasBase'].some(tem)) return

  const vagas = await linhasDe('vagas')
  const cands = await linhasDe('candidaturas')
  const eventos = await linhasDe('eventosCandidatura')
  const bases = await linhasDe('respostasBase')

  if (tem('respostasBase')) {
    for (const [i, r] of bases.entries()) {
      if (!temTxt(r.chave) || !ehTxt(r.rotulo)) invalido(`Backup invalido: respostasBase[${i}] sem chave ou rotulo.`)
      if (typeof r.confirmado !== 'boolean') invalido(`Backup invalido: respostasBase[${i}] sem confirmacao valida.`)
      if (r.confirmado === true && !temTxt(r.textoPt) && !temTxt(r.textoEn)) {
        invalido(`Backup invalido: respostasBase[${i}] esta como confirmada mas nao tem texto.`)
      }
    }
  }
  if (tem('vagas')) {
    for (const [i, v] of vagas.entries()) {
      if (!temTxt(v.chaveDedup) || !temTxt(v.empresa) || !temTxt(v.cargo)) invalido(`Backup invalido: vagas[${i}] sem chave, empresa ou cargo.`)
      if (!statusOk(v.status)) invalido(`Backup invalido: vagas[${i}] com status invalido.`)
      if (!ELEG.includes(v.elegibilidade as string)) invalido(`Backup invalido: vagas[${i}] com elegibilidade invalida.`)
      if (v.elegibilidade !== 'desconhecida' && !temTxt(v.elegibilidadeEvidencia)) {
        invalido(`Backup invalido: vagas[${i}] marca elegibilidade sem evidencia.`)
      }
    }
  }
  const idsVaga = new Set(vagas.map((v) => v.id))
  const idsCand = new Set(cands.map((c) => c.id))
  const confirmadas = new Set(
    bases.filter((b) => b.confirmado === true).flatMap((b) => [b.textoPt, b.textoEn]).filter(temTxt).map((t) => t.trim()),
  )
  const enviosPor = new Set(eventos.filter((e) => e.tipo === 'envio').map((e) => e.candidaturaId))

  if (tem('candidaturas') || tem('vagas')) {
    for (const [i, c] of cands.entries()) {
      const rot = `candidaturas[${i}]`
      if (!ehNum(c.vagaId) || !idsVaga.has(c.vagaId)) invalido(`Backup invalido: ${rot} aponta para uma vaga que nao existe.`)
      if (!statusOk(c.status)) invalido(`Backup invalido: ${rot} com status invalido.`)
      if (!Array.isArray(c.respostas) || !Array.isArray(c.camposPendentes)) invalido(`Backup invalido: ${rot} sem respostas ou campos pendentes.`)
      if (!ehNum(c.criadoEm) || !ehNum(c.atualizadoEm)) invalido(`Backup invalido: ${rot} sem datas.`)
      const st = c.status as number
      const enviou = ehNum(c.enviadaEm)
      if (st >= 4 && st <= 9 && !ehNum(c.aprovadaEm)) invalido(`Backup invalido: ${rot} esta adiante de "aprovada" sem registro de aprovacao.`)
      if (st >= 5 && st <= 9 && !enviou) invalido(`Backup invalido: ${rot} esta como enviada sem data de envio.`)
      if (enviou && !ehNum(c.aprovadaEm)) invalido(`Backup invalido: ${rot} tem envio sem registro de aprovacao.`)
      if (enviou && !enviosPor.has(c.id)) invalido(`Backup invalido: ${rot} esta como enviada sem o evento de envio no historico.`)
      if (c.idempotencyKey !== undefined && !temTxt(c.idempotencyKey)) invalido(`Backup invalido: ${rot} com chave de envio invalida.`)
      for (const [k, r] of (c.respostas as unknown[]).entries()) {
        if (!ehObj(r) || !ehTxt(r.pergunta) || !ehTxt(r.texto) || typeof r.confirmado !== 'boolean') invalido(`Backup invalido: ${rot}.respostas[${k}] malformada.`)
        const rr = r as Linha
        if (rr.origem !== 'base' && rr.origem !== 'manual') invalido(`Backup invalido: ${rot}.respostas[${k}] com origem invalida.`)
        if (st >= 4 && st <= 9 && rr.confirmado !== true) invalido(`Backup invalido: ${rot} tem resposta sem confirmacao em candidatura aprovada.`)
        if (rr.origem === 'base' && !confirmadas.has((rr.texto as string).trim())) {
          invalido(`Backup invalido: ${rot}.respostas[${k}] diz vir da central de dados mas nao bate com resposta confirmada.`)
        }
      }
    }
  }
  if (tem('eventosCandidatura') || tem('candidaturas')) {
    for (const [i, e] of eventos.entries()) {
      if (!ehNum(e.candidaturaId) || !idsCand.has(e.candidaturaId)) invalido(`Backup invalido: eventosCandidatura[${i}] aponta para candidatura que nao existe.`)
      if (!EVENTOS.includes(e.tipo as string) || !ehNum(e.em)) invalido(`Backup invalido: eventosCandidatura[${i}] com tipo ou data invalidos.`)
    }
  }
}

// Valida estrutura E conteudo. Usada pela tela antes de pedir confirmacao.
export async function prepararRestauracao(backup: unknown): Promise<{ tabelas: string[]; avisos: string[] }> {
  const tabelas = validarBackup(backup)
  await validarConteudo(backup as Backup, tabelas)
  return { tabelas, avisos: avisosDeGrupo(tabelas) }
}

// Restauracao: substitui o conteudo SOMENTE das tabelas presentes no arquivo.
// Tabelas ausentes (por exemplo, as de candidaturas em um backup antigo) ficam
// intactas. Tudo ou nada: se algo falhar, a transacao desfaz.
export async function restaurarBackup(backup: Backup): Promise<string[]> {
  const nomes = validarBackup(backup)
  await validarConteudo(backup, nomes)
  const tabelas = nomes.map((n) => db.table(n))
  try {
    await db.transaction('rw', tabelas, async () => {
      for (const t of tabelas) {
        await t.clear()
        const linhas = backup[t.name] as unknown[]
        if (linhas.length > 0) await t.bulkAdd(linhas)
      }
    })
  } catch {
    // Mensagem curta em portugues no lugar do erro cru do Dexie. Nada foi alterado.
    throw new BackupInvalido('Nao consegui restaurar: o arquivo tem dados repetidos ou em formato inesperado. Nada foi alterado.')
  }
  return nomes
}
