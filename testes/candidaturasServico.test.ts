// E1: servico de escrita. As travas valem no servico, nao so na tela.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, semearSeNecessario } from '../src/db'
import { usarBase, idiomaDaVaga } from '../src/logica/candidaturas/perfil'
import {
  criarVaga, iniciarAnaliseVaga, descartarVaga, prepararCandidatura, editarCandidatura,
  aprovarCandidatura, adiarCandidatura, registrarEnvio, mudarStatus, rejeitarCandidatura,
  registrarMarco, registrarEvento, definirFollowUp, importarPerfil,
  criarMetaEntrevistas, RegraViolada, TITULO_META_ENTREVISTAS,
} from '../src/servicos/candidaturas'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await semearSeNecessario()
})

const NOVA = { empresa: 'Acme', cargo: 'AI Engineer', url: 'https://acme.example/jobs/1' }

async function curriculo(chave: 'EN-internacional' | 'PT-brasil' = 'EN-internacional') {
  return (await db.curriculos.where('chave').equals(chave).first())!.id!
}

// Cria vaga + candidatura em 3 (aguardando aprovacao).
async function emAprovacao(extra: Partial<typeof NOVA> = {}) {
  const { vagaId } = await criarVaga({ ...NOVA, ...extra })
  const id = await prepararCandidatura(vagaId, { curriculoId: await curriculo() })
  return { vagaId, id }
}
async function aprovada() {
  const x = await emAprovacao()
  await aprovarCandidatura(x.id)
  return x
}
const rejeita = async (p: Promise<unknown>) => { await expect(p).rejects.toBeInstanceOf(RegraViolada) }

describe('curriculos de referencia', () => {
  it('semeia so os 2 curriculos reais, sem dado pessoal', async () => {
    const cs = await db.curriculos.toArray()
    expect(cs.map((c) => c.chave).sort()).toEqual(['EN-internacional', 'PT-brasil'])
    await semearSeNecessario()
    expect(await db.curriculos.count()).toBe(2)
  })
})

describe('criarVaga', () => {
  it('cria vaga nova com status 1 e log', async () => {
    const r = await criarVaga(NOVA)
    expect(r.criada).toBe(true)
    const v = await db.vagas.get(r.vagaId)
    expect(v?.status).toBe(1)
    expect(v?.plataforma).toBe('manual')
    expect(v?.elegibilidade).toBe('desconhecida')
    expect((await db.logAcoes.where('tipo').equals('vaga_criada').count())).toBe(1)
  })
  it('exige empresa e cargo e recusa link perigoso', async () => {
    await rejeita(criarVaga({ ...NOVA, empresa: '  ' }))
    await rejeita(criarVaga({ ...NOVA, cargo: '' }))
    await rejeita(criarVaga({ ...NOVA, url: 'javascript:alert(1)' }))
    expect(await db.vagas.count()).toBe(0)
  })
  it('DEDUP: a mesma vaga com variacao nao duplica e aponta para a existente', async () => {
    const a = await criarVaga(NOVA)
    const b = await criarVaga({ empresa: ' ACME ', cargo: 'ai engineer', url: 'https://www.acme.example/jobs/1/?utm_source=li' })
    expect(b.criada).toBe(false)
    expect(b.vagaId).toBe(a.vagaId)
    expect(await db.vagas.count()).toBe(1)
    expect(await db.logAcoes.where('tipo').equals('vaga_duplicada').count()).toBe(1)
  })
  it('DEDUP: aponta quando a vaga duplicada ja foi candidatada', async () => {
    const { vagaId, id } = await aprovada()
    await registrarEnvio(id)
    const dup = await criarVaga(NOVA)
    expect(dup.criada).toBe(false)
    expect(dup.vagaId).toBe(vagaId)
    expect(dup.jaCandidatada).toBe(true)
  })
  it('avisa de possivel duplicata (mesma empresa e cargo, URL diferente) mas cria', async () => {
    await criarVaga(NOVA)
    const r = await criarVaga({ ...NOVA, url: 'https://outro.example/vaga/9' })
    expect(r.criada).toBe(true)
    expect(r.possivelDuplicata?.empresa).toBe('Acme')
    expect(await db.vagas.count()).toBe(2)
  })
  it('TRAVA 5: elegibilidade conhecida exige evidencia literal; sem ela fica desconhecida', async () => {
    await rejeita(criarVaga({ ...NOVA, elegibilidade: 'remote_brazil' }))
    const ok = await criarVaga({ ...NOVA, elegibilidade: 'remote_brazil', elegibilidadeEvidencia: 'Open to candidates in Brazil' })
    const v = await db.vagas.get(ok.vagaId)
    expect(v?.elegibilidade).toBe('remote_brazil')
    expect(v?.elegibilidadeEvidencia).toContain('Brazil')
  })
  it('descartar so vale antes da candidatura', async () => {
    const a = await criarVaga(NOVA)
    await iniciarAnaliseVaga(a.vagaId)
    expect((await db.vagas.get(a.vagaId))?.status).toBe(2)
    await rejeita(iniciarAnaliseVaga(a.vagaId))
    await descartarVaga(a.vagaId)
    expect((await db.vagas.get(a.vagaId))?.status).toBe(11)
    const { vagaId } = await emAprovacao({ cargo: 'Outro' })
    await rejeita(descartarVaga(vagaId))
  })
})

describe('prepararCandidatura', () => {
  it('cria candidatura em 3 e espelha na vaga; evento criada', async () => {
    const { vagaId, id } = await emAprovacao()
    expect((await db.candidaturas.get(id))?.status).toBe(3)
    expect((await db.vagas.get(vagaId))?.status).toBe(3)
    expect((await db.eventosCandidatura.where('candidaturaId').equals(id).toArray()).map((e) => e.tipo)).toEqual(['criada'])
  })
  it('uma vaga so tem UMA candidatura (protecao contra duplicidade)', async () => {
    const { vagaId } = await emAprovacao()
    await rejeita(prepararCandidatura(vagaId))
    expect(await db.candidaturas.count()).toBe(1)
  })
  it('chamadas simultaneas criam so uma candidatura', async () => {
    const { vagaId } = await criarVaga(NOVA)
    const r = await Promise.allSettled([prepararCandidatura(vagaId), prepararCandidatura(vagaId), prepararCandidatura(vagaId)])
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1)
    expect(await db.candidaturas.count()).toBe(1)
  })
})

describe('aprovar (3 -> 4)', () => {
  it('grava aprovadaEm e move para 4', async () => {
    const { id, vagaId } = await emAprovacao()
    await aprovarCandidatura(id)
    const c = await db.candidaturas.get(id)
    expect(c?.status).toBe(4)
    expect(c?.aprovadaEm).toBeGreaterThan(0)
    expect((await db.vagas.get(vagaId))?.status).toBe(4)
  })
  it('exige curriculo escolhido', async () => {
    const { vagaId } = await criarVaga(NOVA)
    const id = await prepararCandidatura(vagaId)
    await rejeita(aprovarCandidatura(id))
    expect((await db.candidaturas.get(id))?.status).toBe(3)
  })
  it('so aprova a partir do 3', async () => {
    const { id } = await aprovada()
    await rejeita(aprovarCandidatura(id))
  })
  it('TRAVA 1: resposta nao confirmada bloqueia a aprovacao', async () => {
    const { id } = await emAprovacao()
    await editarCandidatura(id, { respostas: [{ pergunta: 'P', texto: 'T', origem: 'manual', confirmado: false }] })
    await rejeita(aprovarCandidatura(id))
    await rejeita(aprovarCandidatura(id, { ciente: true })) // "ciente" nao libera texto nao confirmado
    expect((await db.candidaturas.get(id))?.status).toBe(3)
  })
  it('campo pendente exige o "ciente" explicito', async () => {
    const { id } = await emAprovacao()
    await editarCandidatura(id, { camposPendentes: ['Pretensao salarial'] })
    await rejeita(aprovarCandidatura(id))
    await aprovarCandidatura(id, { ciente: true })
    expect((await db.candidaturas.get(id))?.status).toBe(4)
  })
  it('salvar para depois mantem em 3 e marca adiadaEm', async () => {
    const { id } = await emAprovacao()
    await adiarCandidatura(id)
    const c = await db.candidaturas.get(id)
    expect(c?.status).toBe(3)
    expect(c?.adiadaEm).toBeGreaterThan(0)
    await aprovarCandidatura(id)
    expect((await db.candidaturas.get(id))?.adiadaEm).toBeUndefined()
  })
})

describe('editar depois de aprovar revoga a aprovacao', () => {
  it('troca de curriculo em 4 volta para 3 e apaga aprovadaEm', async () => {
    const { id } = await aprovada()
    await editarCandidatura(id, { curriculoId: await curriculo('PT-brasil') })
    const c = await db.candidaturas.get(id)
    expect(c?.status).toBe(3)
    expect(c?.aprovadaEm).toBeUndefined()
    const tipos = (await db.eventosCandidatura.where('candidaturaId').equals(id).toArray()).map((e) => e.tipo)
    expect(tipos).toContain('aprovacao_revogada')
    await rejeita(registrarEnvio(id)) // sem aprovacao, sem envio
  })
  it('nao edita candidatura ja enviada', async () => {
    const { id } = await aprovada()
    await registrarEnvio(id)
    await rejeita(editarCandidatura(id, { camposPendentes: ['x'] }))
  })
})

describe('TRAVA 2: envio so com aprovacao', () => {
  it('REJEITA envio de candidatura em 3 (nunca aprovada)', async () => {
    const { id } = await emAprovacao()
    await rejeita(registrarEnvio(id))
    const c = await db.candidaturas.get(id)
    expect(c?.status).toBe(3)
    expect(c?.enviadaEm).toBeUndefined()
    expect(await db.logAcoes.where('tipo').equals('envio_recusado').count()).toBe(1)
  })
  it('REJEITA envio mesmo se alguem forcar status 4 SEM aprovadaEm direto no banco', async () => {
    const { id } = await emAprovacao()
    await db.candidaturas.update(id, { status: 4 }) // manipulacao direta, sem aprovacao
    await rejeita(registrarEnvio(id))
    expect((await db.candidaturas.get(id))?.status).toBe(4)
    expect((await db.candidaturas.get(id))?.enviadaEm).toBeUndefined()
  })
  it('REJEITA marcar 5 pelo mudarStatus e marcar 4 sem aprovar', async () => {
    const { id } = await emAprovacao()
    await rejeita(mudarStatus(id, 5))
    await rejeita(mudarStatus(id, 4))
    const { id: id2 } = await aprovada2()
    await rejeita(mudarStatus(id2, 5))
    expect((await db.candidaturas.get(id2))?.status).toBe(4)
  })
  it('registra o envio com aprovacao: 4 -> 5, enviadaEm, evento e log', async () => {
    const { id, vagaId } = await aprovada()
    const r = await registrarEnvio(id)
    expect(r.jaRegistrado).toBe(false)
    const c = await db.candidaturas.get(id)
    expect(c?.status).toBe(5)
    expect(c?.enviadaEm).toBeGreaterThanOrEqual(c!.aprovadaEm!)
    expect(c?.idempotencyKey).toBe(`envio:${id}`)
    expect((await db.vagas.get(vagaId))?.status).toBe(5)
    expect(await db.logAcoes.where('tipo').equals('envio_registrado').count()).toBe(1)
  })
  it('recusa data de envio no futuro ou anterior a aprovacao', async () => {
    const { id } = await aprovada()
    await rejeita(registrarEnvio(id, { enviadaEm: Date.now() + 10 * 86_400_000 }))
    await rejeita(registrarEnvio(id, { enviadaEm: 1000 }))
    expect((await db.candidaturas.get(id))?.status).toBe(4)
  })
})

async function aprovada2() {
  const { vagaId } = await criarVaga({ empresa: 'Beta', cargo: 'LLM Engineer', url: 'https://beta.example/1' })
  const id = await prepararCandidatura(vagaId, { curriculoId: await curriculo() })
  await aprovarCandidatura(id)
  return { id, vagaId }
}

describe('IDEMPOTENCIA do envio', () => {
  it('repetir o mesmo envio nao muda nada e nao duplica evento', async () => {
    const { id } = await aprovada()
    await registrarEnvio(id)
    const antes = await db.candidaturas.get(id)
    const r = await registrarEnvio(id)
    expect(r.jaRegistrado).toBe(true)
    expect(await db.candidaturas.get(id)).toEqual(antes)
    const envios = await db.eventosCandidatura.where({ candidaturaId: id, tipo: 'envio' }).count()
    expect(envios).toBe(1)
  })
  it('duplo clique simultaneo registra uma vez so', async () => {
    const { id } = await aprovada()
    const r = await Promise.allSettled([registrarEnvio(id), registrarEnvio(id), registrarEnvio(id)])
    expect(r.every((x) => x.status === 'fulfilled')).toBe(true)
    const resultados = r.map((x) => (x as PromiseFulfilledResult<{ jaRegistrado: boolean }>).value.jaRegistrado)
    expect(resultados.filter((j) => !j)).toHaveLength(1)
    expect(await db.eventosCandidatura.where({ candidaturaId: id, tipo: 'envio' }).count()).toBe(1)
  })
  it('a mesma chave nao pode ser usada por outra candidatura', async () => {
    const a = await aprovada()
    const b = await aprovada2()
    await registrarEnvio(a.id, { idempotencyKey: 'K1' })
    await rejeita(registrarEnvio(b.id, { idempotencyKey: 'K1' }))
    expect((await db.candidaturas.get(b.id))?.status).toBe(4)
  })
  it('indice unico no banco segura a chave mesmo por escrita direta', async () => {
    const a = await aprovada()
    const b = await aprovada2()
    await db.candidaturas.update(a.id, { idempotencyKey: 'X' })
    await expect(db.candidaturas.update(b.id, { idempotencyKey: 'X' })).rejects.toThrow()
  })
})

describe('status e marcos', () => {
  it('jornada completa: vaga -> aprovar -> envio -> avaliacao -> entrevista -> teste -> aprovado', async () => {
    const { id, vagaId } = await aprovada()
    await registrarEnvio(id)
    await registrarMarco(id, 'avaliacao', { texto: 'Recrutador abriu' })
    expect((await db.candidaturas.get(id))?.status).toBe(6)
    await registrarMarco(id, 'entrevista', { texto: 'Call com RH', proximoFollowUp: '2026-11-20' })
    expect((await db.candidaturas.get(id))?.status).toBe(7)
    expect((await db.candidaturas.get(id))?.proximoFollowUp).toBe('2026-11-20')
    await registrarMarco(id, 'teste_tecnico')
    expect((await db.candidaturas.get(id))?.status).toBe(8)
    await registrarMarco(id, 'aprovado')
    const c = await db.candidaturas.get(id)
    expect(c?.status).toBe(9)
    expect(c?.desfecho).toBe('aprovado')
    expect(c?.proximoFollowUp).toBeUndefined()
    expect((await db.vagas.get(vagaId))?.status).toBe(9)
    const tipos = (await db.eventosCandidatura.where('candidaturaId').equals(id).sortBy('id')).map((e) => e.tipo)
    expect(tipos).toEqual(['criada', 'aprovada', 'envio', 'avaliacao', 'entrevista', 'teste_tecnico', 'aprovado'])
  })
  it('nao registra entrevista antes de enviar (3 e 4)', async () => {
    const a = await emAprovacao()
    await rejeita(registrarMarco(a.id, 'entrevista'))
    const b = await aprovada2()
    await rejeita(registrarMarco(b.id, 'entrevista'))
    expect((await db.candidaturas.get(b.id))?.status).toBe(4)
  })
  it('mudarStatus recusa transicao invalida e status invalido', async () => {
    const { id } = await aprovada()
    await registrarEnvio(id)
    await rejeita(mudarStatus(id, 3))
    await rejeita(mudarStatus(id, 2))
    await rejeita(mudarStatus(id, 99 as never))
    await mudarStatus(id, 11)
    await rejeita(mudarStatus(id, 6)) // encerrado nao sai
  })
  it('rejeitar antes do envio vira desistencia; depois do envio vira rejeitado', async () => {
    const a = await emAprovacao()
    await rejeitarCandidatura(a.id, 'Nao serve')
    expect((await db.candidaturas.get(a.id))?.status).toBe(10)
    expect((await db.candidaturas.get(a.id))?.desfecho).toBe('desistencia')
    const b = await aprovada2()
    await registrarEnvio(b.id)
    await rejeitarCandidatura(b.id)
    expect((await db.candidaturas.get(b.id))?.desfecho).toBe('rejeitado')
  })
  it('segunda entrevista so acrescenta evento', async () => {
    const { id } = await aprovada()
    await registrarEnvio(id)
    await registrarMarco(id, 'entrevista')
    await registrarMarco(id, 'entrevista', { texto: 'Rodada 2' })
    expect((await db.candidaturas.get(id))?.status).toBe(7)
    expect(await db.eventosCandidatura.where({ candidaturaId: id, tipo: 'entrevista' }).count()).toBe(2)
  })
  it('follow-up so vale para candidatura em andamento; data validada', async () => {
    const { id } = await aprovada()
    await rejeita(definirFollowUp(id, '2026-11-20'))
    await registrarEnvio(id)
    await definirFollowUp(id, '2026-11-20')
    await rejeita(definirFollowUp(id, '20/11/2026'))
    expect((await db.candidaturas.get(id))?.proximoFollowUp).toBe('2026-11-20')
  })
})

describe('eventos append-only', () => {
  it('o servico nao oferece editar nem apagar evento', async () => {
    const mod = await import('../src/servicos/candidaturas')
    const nomes = Object.keys(mod).join(' ')
    expect(nomes).not.toMatch(/(apagar|remover|editar|excluir|deletar|atualizar)Evento/i)
  })
  it('nota e contato exigem texto e nao mudam o status', async () => {
    const { id } = await aprovada()
    await registrarEnvio(id)
    await rejeita(registrarEvento(id, 'nota', '  '))
    await registrarEvento(id, 'contato_recrutador', 'Ana respondeu por e-mail')
    await registrarEvento(id, 'followup')
    expect((await db.candidaturas.get(id))?.status).toBe(5)
    expect(await db.eventosCandidatura.where('candidaturaId').equals(id).count()).toBe(5)
    await rejeita(registrarEvento(9999, 'nota', 'x'))
  })
})

describe('meta Entrevistas qualificadas', () => {
  it('conta 1 por candidatura, uma vez so, com meta existente', async () => {
    await criarMetaEntrevistas(3)
    const { id } = await aprovada()
    await registrarEnvio(id)
    await registrarMarco(id, 'entrevista')
    await registrarMarco(id, 'entrevista')
    const meta = await db.metas.filter((m) => m.titulo === TITULO_META_ENTREVISTAS).first()
    expect(meta?.atual).toBe(1)
    expect(meta?.tipoResultado).toBe('quantidade')
    expect(await db.resultados.where('metaId').equals(meta!.id!).count()).toBe(1)
  })
  it('nao conta entrevista marcada como nao qualificada', async () => {
    await criarMetaEntrevistas(3)
    const { id } = await aprovada()
    await registrarEnvio(id)
    await registrarMarco(id, 'entrevista', { qualificada: false })
    const meta = await db.metas.filter((m) => m.titulo === TITULO_META_ENTREVISTAS).first()
    expect(meta?.atual).toBe(0)
  })
  it('criar a meta depois conta retroativamente, sem duplicar', async () => {
    const { id } = await aprovada()
    await registrarEnvio(id)
    await registrarMarco(id, 'entrevista')
    await criarMetaEntrevistas(3)
    const meta = await db.metas.filter((m) => m.titulo === TITULO_META_ENTREVISTAS).first()
    expect(meta?.atual).toBe(1)
    await rejeita(criarMetaEntrevistas(3))
    await rejeita(criarMetaEntrevistas(0))
  })
})

describe('central de dados (trava 1)', () => {
  const JSON_OK = {
    perfil: [{ chave: 'nome', valor: 'Fulano Teste', confirmado: true }, { chave: 'pretensao', valor: '10', confirmado: false }],
    respostasBase: [
      { chave: 'porque', rotulo: 'Por que a vaga', pergunta: 'Why us?', textoPt: 'Porque sim.', textoEn: 'Because.', confirmado: true },
      { chave: 'salario', rotulo: 'Pretensao salarial', textoPt: 'A combinar', confirmado: false },
      { chave: 'soPt', rotulo: 'So em PT', textoPt: 'Texto', confirmado: true },
    ],
    curriculos: [{ chave: 'EN-internacional', versao: 'v3', arquivo: 'cv-en.docx', formato: 'DOCX' }],
  }
  it('importa e guarda; so confirmado=true fica confirmado; curriculo e atualizado', async () => {
    const r = await importarPerfil(JSON_OK)
    expect(r.pendentes).toBe(2)
    const p = (await db.perfilProfissional.toArray())
    expect(p).toHaveLength(1)
    expect(p[0].campos.find((c) => c.chave === 'pretensao')?.confirmado).toBe(false)
    expect((await db.respostasBase.where('chave').equals('salario').first())?.confirmado).toBe(false)
    expect((await db.curriculos.where('chave').equals('EN-internacional').first())?.versao).toBe('v3')
    expect(await db.curriculos.count()).toBe(2) // nenhum curriculo novo
  })
  it('reimportar atualiza por chave sem duplicar, e perfil continua com 1 linha', async () => {
    await importarPerfil(JSON_OK)
    await importarPerfil(JSON_OK)
    expect(await db.respostasBase.count()).toBe(3)
    expect(await db.perfilProfissional.count()).toBe(1)
  })
  it('texto alterado sem confirmado=true derruba a confirmacao anterior', async () => {
    await importarPerfil(JSON_OK)
    await importarPerfil({ respostasBase: [{ chave: 'porque', rotulo: 'x', textoPt: 'Outro texto', confirmado: false }] })
    expect((await db.respostasBase.where('chave').equals('porque').first())?.confirmado).toBe(false)
  })
  it('JSON invalido e recusado sem gravar nada', async () => {
    await rejeita(importarPerfil({ curriculos: [{ chave: 'Inventado' }] }))
    await rejeita(importarPerfil(null))
    expect(await db.respostasBase.count()).toBe(0)
    expect(await db.perfilProfissional.count()).toBe(0)
  })
  it('usarBase: confirmada entra; nao confirmada ou sem texto no idioma vira PENDENTE, nunca texto', async () => {
    await importarPerfil(JSON_OK)
    const porque = (await db.respostasBase.where('chave').equals('porque').first())!
    const salario = (await db.respostasBase.where('chave').equals('salario').first())!
    const soPt = (await db.respostasBase.where('chave').equals('soPt').first())!
    expect(usarBase(porque, 'en')).toEqual({ tipo: 'ok', resposta: { pergunta: 'Why us?', texto: 'Because.', origem: 'base', confirmado: true } })
    expect(usarBase(porque, 'pt')).toMatchObject({ tipo: 'ok', resposta: { texto: 'Porque sim.' } })
    expect(usarBase(salario, 'pt').tipo).toBe('pendente')
    expect(usarBase(soPt, 'en').tipo).toBe('pendente') // nao inventa traducao
    expect(idiomaDaVaga('pt-BR')).toBe('pt')
    expect(idiomaDaVaga(undefined)).toBe('en')
  })
  it('TRAVA 1 no servico: nao da para forjar resposta "da base" com texto que nao foi confirmado', async () => {
    await importarPerfil(JSON_OK)
    const { id } = await emAprovacao()
    // texto inventado marcado como vindo da base
    await rejeita(editarCandidatura(id, { respostas: [{ pergunta: 'P', texto: 'Tenho 10 anos de experiencia', origem: 'base', confirmado: true }] }))
    // texto de resposta NAO confirmada marcado como da base
    await rejeita(editarCandidatura(id, { respostas: [{ pergunta: 'P', texto: 'A combinar', origem: 'base', confirmado: true }] }))
    expect((await db.candidaturas.get(id))?.respostas).toEqual([])
    // texto confirmado da base passa
    await editarCandidatura(id, { respostas: [{ pergunta: 'Why us?', texto: 'Because.', origem: 'base', confirmado: true }] })
    expect((await db.candidaturas.get(id))?.respostas).toHaveLength(1)
    // texto proprio do Carlos entra como manual
    await editarCandidatura(id, { respostas: [{ pergunta: 'Livre', texto: 'Escrito por mim', origem: 'manual', confirmado: true }] })
    expect((await db.candidaturas.get(id))?.respostas[0].origem).toBe('manual')
  })
})
