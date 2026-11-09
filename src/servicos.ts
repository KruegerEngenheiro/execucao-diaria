// Acoes de negocio que a interface chama. Ponte entre o banco (db) e a logica.
import { db } from './db'
import type {
  Tarefa, Prioridade, Resultado, Meta, ResumoDiario, RegistroBloco,
} from './types'
import { blocosDoDia, type BlocoDia } from './logica/recorrencia'
import { calcularScore } from './logica/score'
import { progressoDoDia } from './logica/progresso'
import { msDecorridos } from './logica/tempo'
import { hojeISO, somaDias } from './utils/datas'

// ---------- Leitura do dia ----------
export async function blocosParaData(dataISO: string): Promise<BlocoDia[]> {
  const [rotinas, excecoes] = await Promise.all([
    db.rotinas.toArray(),
    db.excecoes.where('data').equals(dataISO).toArray(),
  ])
  return blocosDoDia(dataISO, rotinas, excecoes)
}

export async function tarefasDaData(dataISO: string): Promise<Tarefa[]> {
  return db.tarefas.where('data').equals(dataISO).toArray()
}

export async function registrosDaData(dataISO: string): Promise<RegistroBloco[]> {
  return db.registrosBloco.where('data').equals(dataISO).toArray()
}

// ---------- Tarefas ----------
export interface NovaTarefa {
  titulo: string
  descricao?: string
  categoria: string
  prioridade: Prioridade
  data?: string
  prazo?: string
  inicioPlanejado?: string
  fimPlanejado?: string
  duracaoEstimada: number
  metaId?: number
  tags?: string[]
}

export async function criarTarefa(n: NovaTarefa): Promise<number> {
  const agora = Date.now()
  const t: Tarefa = {
    titulo: n.titulo.trim(),
    descricao: n.descricao?.trim() || undefined,
    categoria: n.categoria,
    prioridade: n.prioridade,
    status: 'pendente',
    data: n.data,
    prazo: n.prazo,
    inicioPlanejado: n.inicioPlanejado,
    fimPlanejado: n.fimPlanejado,
    duracaoEstimada: n.duracaoEstimada,
    duracaoReal: 0,
    tempoAcumuladoMs: 0,
    metaId: n.metaId,
    tags: n.tags ?? [],
    criadoEm: agora,
    atualizadoEm: agora,
  }
  return db.tarefas.add(t)
}

export async function atualizarTarefa(id: number, patch: Partial<Tarefa>): Promise<void> {
  await db.tarefas.update(id, { ...patch, atualizadoEm: Date.now() })
}

export async function excluirTarefa(id: number): Promise<void> {
  await db.tarefas.delete(id)
}

export async function reagendarTarefa(id: number, novaData: string, inicio?: string, fim?: string): Promise<void> {
  await atualizarTarefa(id, {
    data: novaData,
    inicioPlanejado: inicio,
    fimPlanejado: fim,
    status: 'pendente',
  })
}

export async function cancelarTarefa(id: number): Promise<void> {
  await atualizarTarefa(id, { status: 'cancelada' })
}

// ---------- Cronometro ----------
export async function iniciarTimer(id: number): Promise<void> {
  // Pausa qualquer outra tarefa em andamento (uma de cada vez).
  const emAndamento = await db.tarefas.where('status').equals('em_andamento').toArray()
  for (const outra of emAndamento) {
    if (outra.id !== id) await pausarTimer(outra.id!)
  }
  await db.tarefas.update(id, {
    status: 'em_andamento',
    cronometroInicio: Date.now(),
    atualizadoEm: Date.now(),
  })
}

export async function pausarTimer(id: number): Promise<void> {
  const t = await db.tarefas.get(id)
  if (!t) return
  const acumulado = msDecorridos(t)
  await db.tarefas.update(id, {
    status: 'pausada',
    tempoAcumuladoMs: acumulado,
    cronometroInicio: undefined,
    atualizadoEm: Date.now(),
  })
}

export async function concluirTarefa(id: number, resultado?: NovoResultado): Promise<void> {
  const t = await db.tarefas.get(id)
  if (!t) return
  const acumulado = msDecorridos(t)
  const minutos = Math.round(acumulado / 60000)
  await db.tarefas.update(id, {
    status: 'concluida',
    tempoAcumuladoMs: acumulado,
    cronometroInicio: undefined,
    duracaoReal: minutos,
    concluidoEm: Date.now(),
    atualizadoEm: Date.now(),
  })
  if (acumulado > 0) {
    await db.execucoes.add({
      tarefaId: id,
      data: t.data ?? hojeISO(),
      inicioEm: t.criadoEm,
      fimEm: Date.now(),
      duracaoMs: acumulado,
    })
  }
  if (resultado) {
    await adicionarResultado({ ...resultado, tarefaId: id, categoria: resultado.categoria ?? t.categoria })
  }
}

// ---------- Registro de blocos de rotina (planejado x realizado) ----------
export async function marcarBloco(
  dataISO: string,
  rotinaId: number,
  status: RegistroBloco['status'],
): Promise<void> {
  const existente = await db.registrosBloco
    .where('[data+rotinaId]').equals([dataISO, rotinaId]).first()
  const agora = new Date()
  const hhmm = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
  if (existente?.id) {
    await db.registrosBloco.update(existente.id, {
      status,
      fimReal: status === 'feito' ? hhmm : existente.fimReal,
    })
  } else {
    await db.registrosBloco.add({
      data: dataISO,
      rotinaId,
      status,
      fimReal: status === 'feito' ? hhmm : undefined,
    })
  }
}

// ---------- Resultados e metas ----------
export interface NovoResultado {
  tarefaId?: number
  tipo: Resultado['tipo']
  valor: number
  unidade?: string
  descricao?: string
  categoria?: string
  metaId?: number
  data?: string
}

export async function adicionarResultado(r: NovoResultado): Promise<number> {
  const id = await db.resultados.add({
    tarefaId: r.tarefaId,
    data: r.data ?? hojeISO(),
    tipo: r.tipo,
    valor: r.valor,
    unidade: r.unidade,
    descricao: r.descricao,
    categoria: r.categoria,
    metaId: r.metaId,
  })
  if (r.metaId) await recomputarMeta(r.metaId)
  return id
}

export async function recomputarMeta(metaId: number): Promise<void> {
  const meta = await db.metas.get(metaId)
  if (!meta) return
  // Soma de resultados ligados a meta. Se a meta tem tipo, soma so daquele tipo.
  const resultados = await db.resultados.where('metaId').equals(metaId).toArray()
  const soma = resultados
    .filter((r) => !meta.tipoResultado || r.tipo === meta.tipoResultado)
    .reduce((s, r) => s + r.valor, 0)
  const status: Meta['status'] = soma >= meta.alvo ? 'concluida' : meta.status === 'pausada' ? 'pausada' : 'ativa'
  await db.metas.update(metaId, { atual: soma, status })
}

export async function criarMeta(m: Omit<Meta, 'id' | 'atual' | 'status'> & { atual?: number }): Promise<number> {
  return db.metas.add({ ...m, atual: m.atual ?? 0, status: 'ativa' })
}

export async function resultadosDaData(dataISO: string): Promise<Resultado[]> {
  return db.resultados.where('data').equals(dataISO).toArray()
}

// ---------- Fechamento do dia ----------
export async function contarSequencia(dataISO: string): Promise<number> {
  // Dias fechados em sequencia imediatamente antes de dataISO.
  let seq = 0
  let cursor = somaDias(dataISO, -1)
  // Limite de seguranca para nao varrer infinito.
  for (let i = 0; i < 400; i++) {
    const r = await db.resumos.where('data').equals(cursor).first()
    if (!r) break
    seq++
    cursor = somaDias(cursor, -1)
  }
  return seq
}

export interface DadosFoco { feitos: number; total: number }

export async function focoDoDia(dataISO: string): Promise<DadosFoco> {
  const blocos = await blocosParaData(dataISO)
  const foco = blocos.filter((b) => b.janela === 'FOCO')
  const registros = await registrosDaData(dataISO)
  const feitos = foco.filter((b) =>
    registros.some((r) => r.rotinaId === b.rotinaId && r.status === 'feito'),
  ).length
  return { feitos, total: foco.length }
}

export async function calcularScoreDoDia(dataISO: string): Promise<ReturnType<typeof calcularScore>> {
  const [tarefas, foco, resultados, seq] = await Promise.all([
    tarefasDaData(dataISO),
    focoDoDia(dataISO),
    resultadosDaData(dataISO),
    contarSequencia(dataISO),
  ])
  return calcularScore({
    tarefas,
    focoFeitos: foco.feitos,
    focoTotal: foco.total,
    numResultados: resultados.length,
    sequenciaDias: seq,
  })
}

export interface ReflexaoDia {
  conquistas: string
  aprendi: string
  melhorar: string
}

export async function fecharDia(dataISO: string, reflexao: ReflexaoDia): Promise<ResumoDiario> {
  const [tarefas, blocos, registros, resultados, scoreRes] = await Promise.all([
    tarefasDaData(dataISO),
    blocosParaData(dataISO),
    registrosDaData(dataISO),
    resultadosDaData(dataISO),
    calcularScoreDoDia(dataISO),
  ])
  void resultados

  const prog = progressoDoDia(blocos, tarefas, registros)
  const contadas = tarefas.filter((t) => t.status !== 'reagendada' && t.status !== 'cancelada')
  const concluidas = contadas.filter((t) => t.status === 'concluida')
  const tempoMin = tarefas.reduce((s, t) => s + (t.duracaoReal || 0), 0)
  const pendencias = contadas
    .filter((t) => t.status !== 'concluida')
    .map((t) => t.titulo)
  const adiadas = tarefas.filter((t) => t.status === 'reagendada').map((t) => t.titulo)

  const resumo: ResumoDiario = {
    data: dataISO,
    percentualExecucao: prog.pct,
    tarefasConcluidas: concluidas.length,
    tarefasContadas: contadas.length,
    tempoExecutadoMin: tempoMin,
    score: scoreRes.score ?? 0,
    pendencias,
    adiadas,
    conquistas: reflexao.conquistas.trim(),
    aprendi: reflexao.aprendi.trim(),
    melhorar: reflexao.melhorar.trim(),
    fechadoEm: Date.now(),
  }

  const existente = await db.resumos.where('data').equals(dataISO).first()
  if (existente?.id) {
    resumo.id = existente.id
    await db.resumos.put(resumo)
  } else {
    resumo.id = await db.resumos.add(resumo)
  }
  return resumo
}

export async function resumoDaData(dataISO: string): Promise<ResumoDiario | undefined> {
  return db.resumos.where('data').equals(dataISO).first()
}

// ---------- Plano de carreira ----------
// Grava o progresso de um item do Plano (curso, item de perfil, post publicado).
// Upsert por chave estavel. valor vazio tambem e gravado (item desmarcado).
export async function marcarPlano(chave: string, valor: string): Promise<void> {
  const existente = await db.planoProgresso.where('chave').equals(chave).first()
  if (existente?.id) {
    await db.planoProgresso.update(existente.id, { valor, atualizadoEm: Date.now() })
  } else {
    await db.planoProgresso.add({ chave, valor, atualizadoEm: Date.now() })
  }
}

// ---------- Plano de carreira de 90 dias ----------
// Marca uma atividade do plano como feita (ou nao) num dia. Upsert por chave
// estavel `${atividadeId}::${dataISO}`.
export async function marcarCarreira(atividadeId: string, dataISO: string, feito: boolean): Promise<void> {
  const chave = `${atividadeId}::${dataISO}`
  const existente = await db.carreiraProgresso.where('chave').equals(chave).first()
  if (existente?.id) {
    await db.carreiraProgresso.update(existente.id, { feito, atualizadoEm: Date.now() })
  } else {
    await db.carreiraProgresso.add({ chave, feito, atualizadoEm: Date.now() })
  }
}
