// Servico de escrita do modulo de candidaturas. Toda regra que protege o
// Carlos vive AQUI, nao so na tela: a UI pode ser contornada, o servico nao.
//
//  - Status so muda pela maquina de estados (logica/candidaturas/status.ts).
//  - 3 -> 4 so por aprovarCandidatura (grava aprovadaEm).
//  - 4 -> 5 so por registrarEnvio, e so com aprovadaEm preenchido.
//  - O app nunca envia nada: "enviada" e o registro manual do Carlos.
//  - Evento e append-only: este arquivo nao exporta editar nem apagar evento.
import { db } from '../db'
import type {
  Vaga, Candidatura, StatusCandidatura, TipoEventoCandidatura, TipoLogAcao,
  RespostaCandidatura, Elegibilidade, Desfecho,
} from '../types'
import { chaveDedup, possivelDuplicata, urlHttpValida } from '../logica/candidaturas/dedup'
import { podeTransitar, STATUS_ROTULO, statusValido } from '../logica/candidaturas/status'
import { validarPerfilJson } from '../logica/candidaturas/perfil'
import { adicionarResultado, criarMeta, recomputarMeta } from '../servicos'

// Erro de regra de negocio: mensagem em portugues, pronta para a tela.
export class RegraViolada extends Error {}

export const TITULO_META_ENTREVISTAS = 'Entrevistas qualificadas'

const TABELAS = () => [
  db.vagas, db.candidaturas, db.eventosCandidatura, db.logAcoes,
  db.curriculos, db.respostasBase, db.perfilProfissional,
]

async function logar(
  tipo: TipoLogAcao,
  extra: { candidaturaId?: number; vagaId?: number; detalhe?: string } = {},
): Promise<void> {
  await db.logAcoes.add({ em: Date.now(), tipo, ...extra })
}

async function evento(
  candidaturaId: number, tipo: TipoEventoCandidatura,
  extra: { texto?: string; deStatus?: StatusCandidatura; paraStatus?: StatusCandidatura; em?: number; qualificada?: boolean } = {},
): Promise<void> {
  await db.eventosCandidatura.add({ candidaturaId, tipo, em: extra.em ?? Date.now(), texto: extra.texto, deStatus: extra.deStatus, paraStatus: extra.paraStatus, qualificada: extra.qualificada })
}

async function candidaturaOuErro(id: number): Promise<Candidatura> {
  const c = await db.candidaturas.get(id)
  if (!c) throw new RegraViolada('Candidatura nao encontrada.')
  return c
}

const aparar = (s: string | undefined, max: number): string | undefined => {
  const t = (s ?? '').trim()
  return t ? t.slice(0, max) : undefined
}
const lista = (v: string[] | undefined): string[] =>
  (v ?? []).map((x) => x.trim()).filter(Boolean).slice(0, 60)

// Normaliza para comparar trecho com descricao: minusculas, sem acento, espacos colapsados.
export const normalizarTexto = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const EVIDENCIA_MIN_SEM_DESCRICAO = 15

// ---------------------------------------------------------------- Vagas

export interface NovaVaga {
  empresa: string
  cargo: string
  url?: string
  descricao?: string
  plataforma?: string
  idExterno?: string
  pais?: string
  elegibilidade?: Elegibilidade
  elegibilidadeEvidencia?: string
  faixaSalarial?: string
  idioma?: string
  senioridade?: string
  tecnologias?: string[]
  obrigatorios?: string[]
  desejaveis?: string[]
  publicadoEm?: string
}

export interface ResultadoCriarVaga {
  vagaId: number
  criada: boolean // false = ja existia (duplicada), nada foi gravado
  jaCandidatada: boolean
  possivelDuplicata?: { id: number; empresa: string; cargo: string }
}

export async function criarVaga(n: NovaVaga): Promise<ResultadoCriarVaga> {
  const empresa = aparar(n.empresa, 120)
  const cargo = aparar(n.cargo, 160)
  if (!empresa) throw new RegraViolada('Informe a empresa.')
  if (!cargo) throw new RegraViolada('Informe o cargo.')
  const url = aparar(n.url, 2000)
  if (url && !urlHttpValida(url)) throw new RegraViolada('O link precisa comecar com http:// ou https://.')
  const elegibilidade: Elegibilidade = n.elegibilidade ?? 'desconhecida'
  const evidencia = aparar(n.elegibilidadeEvidencia, 600)
  // Trava 5: sem evidencia literal da vaga, elegibilidade e "desconhecida".
  const descricao = aparar(n.descricao, 20000)
  const alertas: string[] = []
  if (elegibilidade !== 'desconhecida') {
    if (!evidencia) {
      throw new RegraViolada('Para marcar a elegibilidade, cole o trecho da vaga que comprova. Sem evidencia, fica desconhecida.')
    }
    if (descricao) {
      // Evidencia tem que estar LITERALMENTE na descricao colada.
      if (!normalizarTexto(descricao).includes(normalizarTexto(evidencia))) {
        throw new RegraViolada('O trecho de evidencia nao aparece na descricao da vaga. Cole o trecho exato da vaga, ou deixe a elegibilidade como desconhecida.')
      }
    } else {
      if (normalizarTexto(evidencia).length < EVIDENCIA_MIN_SEM_DESCRICAO) {
        throw new RegraViolada('A evidencia esta curta demais para comprovar. Cole a frase inteira da vaga.')
      }
      alertas.push('Elegibilidade sem fonte colada: a evidencia nao foi conferida com a descricao da vaga.')
    }
  }
  const plataforma = (aparar(n.plataforma, 60) ?? 'manual')
  const chave = chaveDedup({ plataforma, idExterno: n.idExterno, empresa, cargo, url })

  return db.transaction('rw', TABELAS(), async () => {
    const existente = await db.vagas.where('chaveDedup').equals(chave).first()
    if (existente) {
      const cands = await db.candidaturas.where('vagaId').equals(existente.id!).toArray()
      await logar('vaga_duplicada', { vagaId: existente.id, detalhe: 'mesma chave' })
      return { vagaId: existente.id!, criada: false, jaCandidatada: cands.some((c) => c.status >= 5) }
    }
    const todas = await db.vagas.toArray()
    const parecida = possivelDuplicata({ empresa, cargo }, todas)
    const agora = Date.now()
    const vaga: Vaga = {
      chaveDedup: chave, empresa, cargo,
      pais: aparar(n.pais, 80), elegibilidade,
      elegibilidadeEvidencia: elegibilidade === 'desconhecida' ? undefined : evidencia,
      faixaSalarial: aparar(n.faixaSalarial, 80), idioma: aparar(n.idioma, 30),
      senioridade: aparar(n.senioridade, 40),
      tecnologias: lista(n.tecnologias), obrigatorios: lista(n.obrigatorios), desejaveis: lista(n.desejaveis),
      url, plataforma, idExterno: aparar(n.idExterno, 120), publicadoEm: aparar(n.publicadoEm, 10),
      descricao,
      situacaoVaga: 'desconhecida', status: 1, alertas, criadoEm: agora, atualizadoEm: agora,
    }
    const vagaId = await db.vagas.add(vaga)
    await logar('vaga_criada', { vagaId, detalhe: plataforma })
    return {
      vagaId, criada: true, jaCandidatada: false,
      possivelDuplicata: parecida ? { id: parecida.id!, empresa: parecida.empresa, cargo: parecida.cargo } : undefined,
    }
  })
}

// 1 -> 2: o Carlos comecou a analisar.
export async function iniciarAnaliseVaga(vagaId: number): Promise<void> {
  await db.transaction('rw', TABELAS(), async () => {
    const v = await db.vagas.get(vagaId)
    if (!v) throw new RegraViolada('Vaga nao encontrada.')
    if (!podeTransitar(v.status, 2) || v.status !== 1) throw new RegraViolada('Essa vaga nao esta como nova.')
    await db.vagas.update(vagaId, { status: 2, atualizadoEm: Date.now() })
    await logar('status', { vagaId, detalhe: '1->2' })
  })
}

// Descarta uma vaga que ainda nao virou candidatura (1 ou 2 -> 11).
export async function descartarVaga(vagaId: number): Promise<void> {
  await db.transaction('rw', TABELAS(), async () => {
    const v = await db.vagas.get(vagaId)
    if (!v) throw new RegraViolada('Vaga nao encontrada.')
    if (v.status !== 1 && v.status !== 2) throw new RegraViolada('Essa vaga ja tem candidatura. Use rejeitar ou encerrar na candidatura.')
    await db.vagas.update(vagaId, { status: 11, atualizadoEm: Date.now() })
    await logar('vaga_descartada', { vagaId })
  })
}

// ---------------------------------------------------------- Candidaturas

// Cria a candidatura (status 3, aguardando aprovacao) a partir de uma vaga 1 ou 2.
// Uma vaga so pode ter UMA candidatura: protege contra candidatura duplicada.
export async function prepararCandidatura(vagaId: number, opts: { curriculoId?: number } = {}): Promise<number> {
  return db.transaction('rw', TABELAS(), async () => {
    const v = await db.vagas.get(vagaId)
    if (!v) throw new RegraViolada('Vaga nao encontrada.')
    if (v.status !== 1 && v.status !== 2) throw new RegraViolada('Essa vaga nao pode virar candidatura agora.')
    if ((await db.candidaturas.where('vagaId').equals(vagaId).count()) > 0) {
      throw new RegraViolada('Ja existe candidatura para essa vaga.')
    }
    if (opts.curriculoId != null && !(await db.curriculos.get(opts.curriculoId))) {
      throw new RegraViolada('Curriculo nao encontrado.')
    }
    const agora = Date.now()
    const id = await db.candidaturas.add({
      vagaId, status: 3, curriculoId: opts.curriculoId, respostas: [], camposPendentes: [],
      criadoEm: agora, atualizadoEm: agora,
    })
    await db.vagas.update(vagaId, { status: 3, atualizadoEm: agora })
    await evento(id, 'criada', { paraStatus: 3 })
    await logar('candidatura_criada', { candidaturaId: id, vagaId })
    return id
  })
}

export interface EdicaoCandidatura {
  curriculoId?: number
  respostas?: RespostaCandidatura[]
  camposPendentes?: string[]
}

// Editar ou trocar curriculo muda a peca. Se ja estava aprovada (4), a aprovacao
// e REVOGADA: volta para 3 e precisa ser aprovada de novo.
export async function editarCandidatura(id: number, patch: EdicaoCandidatura): Promise<void> {
  await db.transaction('rw', TABELAS(), async () => {
    const c = await candidaturaOuErro(id)
    if (c.status !== 3 && c.status !== 4) throw new RegraViolada('So da para editar antes do envio.')
    if (patch.curriculoId != null && !(await db.curriculos.get(patch.curriculoId))) {
      throw new RegraViolada('Curriculo nao encontrado.')
    }
    if (patch.respostas) {
      // Trava 1: resposta marcada como "da base" so vale se o texto bate com uma
      // resposta CONFIRMADA da central de dados. Nao da para forjar pela interface.
      const bases = await db.respostasBase.toArray()
      const ok = new Set(bases.filter((b) => b.confirmado === true).flatMap((b) => [b.textoPt?.trim(), b.textoEn?.trim()]).filter(Boolean))
      for (const r of patch.respostas) {
        if (r.origem !== 'base' && r.origem !== 'manual') throw new RegraViolada('Origem de resposta invalida.')
        if (r.origem === 'base' && !ok.has(r.texto.trim())) {
          throw new RegraViolada('Uma resposta diz vir da central de dados, mas o texto nao bate com nenhuma resposta confirmada.')
        }
      }
    }
    const novo: Partial<Candidatura> = { atualizadoEm: Date.now() }
    if (patch.curriculoId != null) novo.curriculoId = patch.curriculoId
    if (patch.respostas) {
      novo.respostas = patch.respostas.slice(0, 40).map((r) => ({
        pergunta: r.pergunta.trim().slice(0, 500),
        texto: r.texto.trim().slice(0, 5000),
        origem: r.origem,
        confirmado: r.confirmado === true,
      }))
    }
    if (patch.camposPendentes) novo.camposPendentes = patch.camposPendentes.map((p) => p.trim()).filter(Boolean).slice(0, 40)
    if (c.status === 4) {
      novo.status = 3
      novo.aprovadaEm = undefined
      await db.vagas.update(c.vagaId, { status: 3, atualizadoEm: Date.now() })
      await evento(id, 'aprovacao_revogada', { deStatus: 4, paraStatus: 3, texto: 'Peca alterada depois da aprovacao' })
    }
    await db.candidaturas.update(id, novo)
    await evento(id, 'editada')
    await logar('candidatura_editada', { candidaturaId: id })
  })
}

export async function aprovarCandidatura(id: number, opts: { ciente?: boolean } = {}): Promise<void> {
  await db.transaction('rw', TABELAS(), async () => {
    const c = await candidaturaOuErro(id)
    if (c.status !== 3) throw new RegraViolada('So da para aprovar uma candidatura aguardando aprovacao.')
    if (c.curriculoId == null || !(await db.curriculos.get(c.curriculoId))) {
      throw new RegraViolada('Escolha o curriculo antes de aprovar.')
    }
    if (c.respostas.some((r) => r.confirmado !== true)) {
      throw new RegraViolada('Ha resposta sem confirmacao. Confirme ou remova antes de aprovar.')
    }
    if (c.camposPendentes.length > 0 && !opts.ciente) {
      throw new RegraViolada('Ha campos pendentes de confirmacao. Aprove so se estiver ciente.')
    }
    const agora = Date.now()
    await db.candidaturas.update(id, { status: 4, aprovadaEm: agora, adiadaEm: undefined, atualizadoEm: agora })
    await db.vagas.update(c.vagaId, { status: 4, atualizadoEm: agora })
    await evento(id, 'aprovada', { deStatus: 3, paraStatus: 4, em: agora })
    await logar('aprovada', { candidaturaId: id, vagaId: c.vagaId })
  })
}

// "Salvar para depois": fica em 3, so marca que o Carlos adiou.
export async function adiarCandidatura(id: number): Promise<void> {
  await db.transaction('rw', TABELAS(), async () => {
    const c = await candidaturaOuErro(id)
    if (c.status !== 3) throw new RegraViolada('So da para adiar uma candidatura aguardando aprovacao.')
    await db.candidaturas.update(id, { adiadaEm: Date.now(), atualizadoEm: Date.now() })
    await evento(id, 'adiada')
  })
}

// Retentativa de envio ja registrado com outra chave: recusa, mas NAO e tentativa
// de burlar regra, entao nao entra na auditoria como "envio_recusado".
class EnvioJaRegistrado extends RegraViolada {}

export interface ResultadoEnvio {
  jaRegistrado: boolean // true = chamada repetida, nada mudou
}

// Registra que o Carlos ENVIOU a candidatura. Nao envia nada.
// Regras: so a partir do status 4 com aprovadaEm preenchido; idempotente pela chave.
export async function registrarEnvio(
  id: number, opts: { idempotencyKey?: string; enviadaEm?: number } = {},
): Promise<ResultadoEnvio> {
  const chave = (opts.idempotencyKey ?? `envio:${id}`).trim()
  if (!chave) throw new RegraViolada('Chave de envio invalida.')
  try {
    return await db.transaction('rw', TABELAS(), async () => {
      const c = await candidaturaOuErro(id)
      const dono = await db.candidaturas.where('idempotencyKey').equals(chave).first()
      if (dono) {
        if (dono.id === id) return { jaRegistrado: true }
        throw new RegraViolada('Essa chave de envio ja pertence a outra candidatura.')
      }
      if (c.status >= 5 && c.enviadaEm && c.idempotencyKey) throw new EnvioJaRegistrado('O envio dessa candidatura ja foi registrado antes.')
      if (c.status !== 4) throw new RegraViolada('So da para registrar envio de uma candidatura aprovada e preparada.')
      if (!c.aprovadaEm) throw new RegraViolada('Envio recusado: a candidatura nao tem aprovacao registrada.')
      const agora = Date.now()
      const enviadaEm = opts.enviadaEm ?? agora
      if (!Number.isFinite(enviadaEm) || enviadaEm > agora + 60_000) throw new RegraViolada('A data de envio nao pode estar no futuro.')
      if (enviadaEm < c.aprovadaEm) throw new RegraViolada('O envio nao pode ser anterior a aprovacao.')
      await db.candidaturas.update(id, { status: 5, enviadaEm, idempotencyKey: chave, atualizadoEm: agora })
      await db.vagas.update(c.vagaId, { status: 5, atualizadoEm: agora })
      await evento(id, 'envio', { deStatus: 4, paraStatus: 5, em: enviadaEm })
      await logar('envio_registrado', { candidaturaId: id, vagaId: c.vagaId })
      return { jaRegistrado: false }
    })
  } catch (e) {
    if (e instanceof RegraViolada && !(e instanceof EnvioJaRegistrado)) {
      // Fora da transacao: o log da recusa nao pode ser desfeito junto.
      await logar('envio_recusado', { candidaturaId: id, detalhe: e.message.slice(0, 120) })
    }
    throw e
  }
}

// Mudanca de status generica, sempre validada pela maquina de estados.
// 4 e 5 tem porta propria (aprovar, registrarEnvio) e 1 e 2 so existem na vaga.
export async function mudarStatus(id: number, para: StatusCandidatura, texto?: string): Promise<void> {
  await db.transaction('rw', TABELAS(), async () => {
    await aplicarStatus(id, para, { texto })
  })
}

async function aplicarStatus(
  id: number, para: StatusCandidatura,
  extra: { texto?: string; em?: number; tipo?: TipoEventoCandidatura; qualificada?: boolean } = {},
): Promise<Candidatura> {
  if (!statusValido(para)) throw new RegraViolada('Status invalido.')
  if (para === 4) throw new RegraViolada('Para preparar, use aprovar.')
  if (para === 5) throw new RegraViolada('Para marcar como enviada, use registrar envio.')
  if (para === 1 || para === 2) throw new RegraViolada('Uma candidatura nao volta para nova ou analisando.')
  const c = await candidaturaOuErro(id)
  if (!podeTransitar(c.status, para)) {
    throw new RegraViolada(`Nao da para ir de "${STATUS_ROTULO[c.status]}" para "${STATUS_ROTULO[para]}".`)
  }
  const agora = extra.em ?? Date.now()
  const patch: Partial<Candidatura> = { status: para, atualizadoEm: Date.now() }
  if (para === 3) patch.aprovadaEm = undefined // voltou para aprovacao: aprovacao cai
  if (para === 9 || para === 10 || para === 11) {
    const desfecho: Desfecho = para === 9 ? 'aprovado' : para === 11 ? 'encerrado' : c.enviadaEm ? 'rejeitado' : 'desistencia'
    patch.desfecho = desfecho
    patch.desfechoEm = agora
    patch.proximoFollowUp = undefined
  }
  await db.candidaturas.update(id, patch)
  await db.vagas.update(c.vagaId, { status: para, atualizadoEm: Date.now() })
  await evento(id, extra.tipo ?? 'status', { deStatus: c.status, paraStatus: para, texto: extra.texto, em: agora, qualificada: extra.qualificada })
  await logar('status', { candidaturaId: id, vagaId: c.vagaId, detalhe: `${c.status}->${para}` })
  return { ...c, ...patch } as Candidatura
}

// Rejeitar antes do envio (desistencia) ou registrar rejeicao da empresa.
export async function rejeitarCandidatura(id: number, motivo?: string): Promise<void> {
  await db.transaction('rw', TABELAS(), async () => {
    await aplicarStatus(id, 10, { texto: motivo?.trim().slice(0, 500) || undefined, tipo: 'rejeicao' })
  })
}

export type Marco = 'avaliacao' | 'entrevista' | 'teste_tecnico' | 'aprovado' | 'rejeicao' | 'encerrada'
export const MARCO_STATUS: Record<Marco, StatusCandidatura> = {
  avaliacao: 6, entrevista: 7, teste_tecnico: 8, aprovado: 9, rejeicao: 10, encerrada: 11,
}

// Marcos do processo (avaliacao, entrevista, teste...). Move o status e grava o
// evento. Repetir o marco do status atual (2a entrevista) so acrescenta evento.
export async function registrarMarco(
  id: number, marco: Marco,
  opts: { texto?: string; em?: number; proximoFollowUp?: string; qualificada?: boolean } = {},
): Promise<void> {
  const para = MARCO_STATUS[marco]
  const em = opts.em ?? Date.now()
  if (!Number.isFinite(em) || em > Date.now() + 366 * 86_400_000) throw new RegraViolada('Data invalida.')
  const texto = opts.texto?.trim().slice(0, 1000) || undefined
  if (opts.proximoFollowUp && !/^\d{4}-\d{2}-\d{2}$/.test(opts.proximoFollowUp)) throw new RegraViolada('Data de follow-up invalida.')
  const q = marco === 'entrevista' ? opts.qualificada !== false : undefined
  await db.transaction('rw', TABELAS(), async () => {
    const c = await candidaturaOuErro(id)
    if (c.status === para) {
      await evento(id, marco, { texto, em, qualificada: q })
    } else {
      await aplicarStatus(id, para, { texto, em, tipo: marco, qualificada: q })
    }
    const fresco = await candidaturaOuErro(id)
    if (opts.proximoFollowUp && fresco.status >= 5 && fresco.status <= 8) {
      await db.candidaturas.update(id, { proximoFollowUp: opts.proximoFollowUp })
    }
  })
  if (marco === 'entrevista' && opts.qualificada !== false) await contarEntrevistaQualificada(id)
}

// Eventos livres que NAO mudam status. Append-only.
export async function registrarEvento(
  id: number, tipo: 'nota' | 'contato_recrutador' | 'followup', texto?: string, em?: number,
): Promise<void> {
  const t = texto?.trim().slice(0, 1000)
  if (tipo !== 'followup' && !t) throw new RegraViolada('Escreva o que aconteceu.')
  await db.transaction('rw', TABELAS(), async () => {
    await candidaturaOuErro(id)
    await evento(id, tipo, { texto: t || undefined, em })
    await logar('evento', { candidaturaId: id, detalhe: tipo })
  })
}

export async function definirFollowUp(id: number, dataISO: string | undefined): Promise<void> {
  if (dataISO && !/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) throw new RegraViolada('Data de follow-up invalida.')
  const c = await candidaturaOuErro(id)
  if (c.status < 5 || c.status > 8) throw new RegraViolada('Follow-up so vale para candidatura em andamento.')
  await db.candidaturas.update(id, { proximoFollowUp: dataISO, atualizadoEm: Date.now() })
}

// ------------------------------------------------------ Meta de entrevistas

// Soma 1 na meta "Entrevistas qualificadas", uma vez por candidatura.
// Se a meta ainda nao existe, nao conta agora: criarMetaEntrevistas faz a
// retroativa. Reserva a contagem ANTES de somar (em caso de falha, conta a
// menos, nunca a mais).
export async function contarEntrevistaQualificada(candidaturaId: number): Promise<boolean> {
  const meta = await db.metas.filter((m) => m.titulo === TITULO_META_ENTREVISTAS).first()
  if (!meta?.id) return false
  const reservou = await db.transaction('rw', db.candidaturas, async () => {
    const c = await db.candidaturas.get(candidaturaId)
    if (!c || c.entrevistaContadaEm) return false
    await db.candidaturas.update(candidaturaId, { entrevistaContadaEm: Date.now() })
    return true
  })
  if (!reservou) return false
  const c = await db.candidaturas.get(candidaturaId)
  const v = c ? await db.vagas.get(c.vagaId) : undefined
  await adicionarResultado({
    tipo: 'quantidade', valor: 1, unidade: 'entrevistas', categoria: 'Candidaturas', metaId: meta.id,
    descricao: v ? `Entrevista: ${v.empresa}` : 'Entrevista',
  })
  return true
}

export async function criarMetaEntrevistas(alvo: number): Promise<number> {
  if (!Number.isFinite(alvo) || alvo < 1) throw new RegraViolada('Informe um alvo maior que zero.')
  const existente = await db.metas.filter((m) => m.titulo === TITULO_META_ENTREVISTAS).first()
  if (existente?.id) throw new RegraViolada('A meta de entrevistas ja existe.')
  const metaId = await criarMeta({
    titulo: TITULO_META_ENTREVISTAS, categoria: 'Candidaturas', alvo: Math.round(alvo),
    unidade: 'entrevistas', tipoResultado: 'quantidade',
  })
  // Retroativo: RECONTA pelos eventos de entrevista QUALIFICADA. A meta acabou de
  // nascer (zero resultados), entao qualquer entrevistaContadaEm herdado (por exemplo
  // de um backup restaurado sem a tabela metas) esta velho e e zerado antes.
  await db.transaction('rw', db.candidaturas, async () => {
    await db.candidaturas.toCollection().modify((c) => { delete c.entrevistaContadaEm })
  })
  const eventos = await db.eventosCandidatura.where('tipo').equals('entrevista').toArray()
  const qualificadas = new Set(eventos.filter((e) => e.qualificada !== false).map((e) => e.candidaturaId))
  for (const cid of qualificadas) await contarEntrevistaQualificada(cid)
  await recomputarMeta(metaId)
  return metaId
}

// ------------------------------------------------------ Central de dados

export interface ResumoImportacao {
  campos: number
  respostas: number
  curriculos: number
  pendentes: number
  avisos: string[]
}

// Importa o JSON de perfil. Nada de dado pessoal no codigo: ele entra por aqui.
// Dado sem confirmado=true fica pendente. Importar de novo atualiza por chave.
export async function importarPerfil(dados: unknown): Promise<ResumoImportacao> {
  const v = validarPerfilJson(dados)
  if (v.erros.length > 0) throw new RegraViolada(v.erros.slice(0, 4).join(' '))
  const agora = Date.now()
  const avisos = [...v.avisos]
  await db.transaction('rw', TABELAS(), async () => {
    if (v.campos.length > 0) {
      await db.perfilProfissional.clear()
      await db.perfilProfissional.add({ campos: v.campos, importadoEm: agora })
    }
    for (const r of v.respostas) {
      const atual = await db.respostasBase.where('chave').equals(r.chave).first()
      const mudouTexto = !atual || atual.textoPt !== r.textoPt || atual.textoEn !== r.textoEn
      // Confirmacao anterior nao sobrevive a texto novo sem confirmado=true no arquivo.
      const confirmadoEm = r.confirmado ? (atual?.confirmado && !mudouTexto ? atual.confirmadoEm ?? agora : agora) : undefined
      if (atual?.id) await db.respostasBase.update(atual.id, { ...r, confirmadoEm })
      else await db.respostasBase.add({ ...r, confirmadoEm })
    }
    for (const c of v.curriculos) {
      const atual = await db.curriculos.where('chave').equals(c.chave).first()
      if (atual?.id) {
        await db.curriculos.update(atual.id, {
          versao: c.versao ?? atual.versao, hash: c.hash ?? atual.hash,
          arquivo: c.arquivo ?? atual.arquivo, formato: c.formato ?? atual.formato, atualizadoEm: agora,
        })
      } else {
        avisos.push(`Curriculo "${c.chave}" nao existe neste aparelho, entao foi ignorado.`)
      }
    }
    await logar('perfil_importado', { detalhe: `${v.campos.length} campos, ${v.respostas.length} respostas` })
  })
  const pendentes = v.campos.filter((c) => !c.confirmado).length + v.respostas.filter((r) => !r.confirmado).length
  return { campos: v.campos.length, respostas: v.respostas.length, curriculos: v.curriculos.length, pendentes, avisos }
}
