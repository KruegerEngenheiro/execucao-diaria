// E1: logica pura de candidaturas (status, dedup, perfil, hoje, contagens).
import { describe, it, expect } from 'vitest'
import {
  podeTransitar, transicoesDe, TODOS_STATUS, statusValido, corDoStatus, grupoDoStatus, STATUS_ROTULO,
} from '../src/logica/candidaturas/status'
import { chaveDedup, urlCanonica, normalizarTexto, possivelDuplicata, urlHttpValida } from '../src/logica/candidaturas/dedup'
import { validarPerfilJson, textoDaResposta, campoUsavel } from '../src/logica/candidaturas/perfil'
import { resumoHojeCandidaturas } from '../src/logica/candidaturas/hoje'
import { contar } from '../src/logica/candidaturas/contagens'
import type { Candidatura, Vaga, StatusCandidatura } from '../src/types'
import exemploRaw from '../docs/exemplos/perfil-candidaturas.exemplo.json?raw'

const cand = (o: Partial<Candidatura>): Candidatura => ({
  vagaId: 1, status: 3, respostas: [], camposPendentes: [], criadoEm: 0, atualizadoEm: 0, ...o,
})

describe('maquina de estados', () => {
  it('tem os 11 status com rotulo', () => {
    expect(TODOS_STATUS).toHaveLength(11)
    for (const s of TODOS_STATUS) expect(STATUS_ROTULO[s]).toBeTruthy()
  })
  it('caminho feliz: 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 11', () => {
    const caminho: StatusCandidatura[] = [3, 4, 5, 6, 7, 8, 9, 11]
    for (let i = 0; i < caminho.length - 1; i++) expect(podeTransitar(caminho[i], caminho[i + 1])).toBe(true)
  })
  it('nao pula etapas: 3 -> 5, 4 -> 7, 3 -> 7 sao proibidas', () => {
    expect(podeTransitar(3, 5)).toBe(false)
    expect(podeTransitar(4, 7)).toBe(false)
    expect(podeTransitar(3, 7)).toBe(false)
    expect(podeTransitar(1, 5)).toBe(false)
  })
  it('estados finais nao saem (encerrado) e 9/10 so vao para 11', () => {
    expect(transicoesDe(11)).toEqual([])
    expect(transicoesDe(10)).toEqual([11])
    expect(transicoesDe(9)).toEqual([11])
    expect(podeTransitar(10, 5)).toBe(false)
  })
  it('qualquer status aberto pode ser rejeitado ou encerrado', () => {
    for (const s of [1, 2, 3, 4, 5, 6, 7, 8] as StatusCandidatura[]) {
      expect(podeTransitar(s, 10)).toBe(true)
      expect(podeTransitar(s, 11)).toBe(true)
    }
  })
  it('FORCA A FALHA: ninguem chega a 5 (enviada) sem ser a partir do 4', () => {
    const origens = TODOS_STATUS.filter((s) => podeTransitar(s, 5))
    expect(origens).toEqual([4])
  })
  it('statusValido recusa lixo', () => {
    for (const x of [0, 12, 1.5, '3', null, undefined, NaN]) expect(statusValido(x)).toBe(false)
    expect(statusValido(7)).toBe(true)
  })
  it('cores: ok aprovado, danger so rejeitado, warn pendente/avaliacao, faint encerrado', () => {
    expect(corDoStatus(9)).toBe('ok')
    expect(corDoStatus(10)).toBe('danger')
    expect(corDoStatus(3)).toBe('warn')
    expect(corDoStatus(6)).toBe('warn')
    expect(corDoStatus(11)).toBe('faint')
    expect(corDoStatus(7)).toBe('accent')
    expect(TODOS_STATUS.filter((s) => corDoStatus(s) === 'danger')).toEqual([10])
  })
  it('agrupa nas sub-telas', () => {
    expect(grupoDoStatus(2)).toBe('vagas')
    expect(grupoDoStatus(4)).toBe('aprovar')
    expect(grupoDoStatus(6)).toBe('enviadas')
    expect(grupoDoStatus(8)).toBe('entrevistas')
    expect(grupoDoStatus(11)).toBe('historico')
  })
})

describe('dedup', () => {
  it('normaliza texto (acento, caixa, pontuacao)', () => {
    expect(normalizarTexto('  Engenheiro de IA, Sênior!! ')).toBe('engenheiro de ia senior')
  })
  it('URL canonica ignora www, protocolo, rastreio, hash e barra final', () => {
    const a = urlCanonica('https://www.Acme.com/jobs/123/?utm_source=x&fbclid=abc#apply')
    const b = urlCanonica('http://acme.com/jobs/123')
    expect(a).toBe('acme.com/jobs/123')
    expect(a).toBe(b)
  })
  it('URL canonica mantem parametro que identifica a vaga', () => {
    expect(urlCanonica('https://x.com/jobs?currentJobId=99&utm_medium=a')).toBe('x.com/jobs?currentJobId=99')
    expect(urlCanonica('https://x.com/jobs?currentJobId=99')).not.toBe(urlCanonica('https://x.com/jobs?currentJobId=100'))
  })
  it('URL invalida ou vazia vira vazio', () => {
    expect(urlCanonica('')).toBe('')
    expect(urlCanonica(undefined)).toBe('')
    expect(urlCanonica('http://')).toBe('')
  })
  it('mesma vaga com variacao de caixa, acento e rastreio gera a mesma chave', () => {
    const a = chaveDedup({ empresa: 'ACME Inc.', cargo: 'AI Engineer', url: 'https://acme.com/j/1?utm_source=li' })
    const b = chaveDedup({ empresa: 'acme inc', cargo: 'ai  engineer', url: 'acme.com/j/1/' })
    expect(a).toBe(b)
  })
  it('vagas diferentes geram chaves diferentes', () => {
    const base = { empresa: 'Acme', cargo: 'AI Engineer', url: 'https://acme.com/j/1' }
    expect(chaveDedup(base)).not.toBe(chaveDedup({ ...base, cargo: 'Backend Engineer' }))
    expect(chaveDedup(base)).not.toBe(chaveDedup({ ...base, empresa: 'Beta' }))
    expect(chaveDedup(base)).not.toBe(chaveDedup({ ...base, url: 'https://acme.com/j/2' }))
  })
  it('plataforma + id externo tem prioridade sobre empresa e cargo', () => {
    const a = chaveDedup({ plataforma: 'Himalayas', idExterno: 'ABC1', empresa: 'A', cargo: 'X' })
    const b = chaveDedup({ plataforma: 'himalayas', idExterno: 'abc1', empresa: 'Outra', cargo: 'Y' })
    expect(a).toBe(b)
    expect(a.startsWith('ext:')).toBe(true)
  })
  it('plataforma manual ignora id externo (cai em empresa+cargo+url)', () => {
    expect(chaveDedup({ plataforma: 'manual', idExterno: '1', empresa: 'A', cargo: 'X' }).startsWith('ec:')).toBe(true)
  })
  it('possivelDuplicata acha empresa+cargo iguais com URL diferente', () => {
    const existentes = [{ id: 1, empresa: 'Acme', cargo: 'AI Engineer' }, { id: 2, empresa: 'Beta', cargo: 'SRE' }]
    expect(possivelDuplicata({ empresa: 'ACME', cargo: 'ai engineer' }, existentes)?.id).toBe(1)
    expect(possivelDuplicata({ empresa: 'Gama', cargo: 'AI Engineer' }, existentes)).toBeUndefined()
  })
  it('so aceita link http e https (bloqueia javascript:)', () => {
    expect(urlHttpValida('https://a.com')).toBe(true)
    expect(urlHttpValida('http://a.com/x')).toBe(true)
    for (const x of ['javascript:alert(1)', 'data:text/html,x', 'ftp://a.com', 'a.com', '', undefined]) expect(urlHttpValida(x)).toBe(false)
  })
})

describe('perfil JSON (trava 1)', () => {
  it('so confirmado === true booleano conta como confirmado', () => {
    const v = validarPerfilJson({
      perfil: [
        { chave: 'a', valor: 'x', confirmado: true },
        { chave: 'b', valor: 'x', confirmado: 'true' },
        { chave: 'c', valor: 'x', confirmado: 1 },
        { chave: 'd', valor: 'x' },
        { chave: 'e', valor: '', confirmado: true },
      ],
    })
    expect(v.erros).toEqual([])
    expect(v.campos.map((c) => c.confirmado)).toEqual([true, false, false, false, false])
    expect(v.avisos[0]).toContain('pendentes')
  })
  it('resposta sem texto nunca fica confirmada; sem confirmado fica pendente', () => {
    const v = validarPerfilJson({
      respostasBase: [
        { chave: 'r1', textoPt: 'ok', confirmado: true },
        { chave: 'r2', confirmado: true },
        { chave: 'r3', textoEn: 'x' },
      ],
    })
    expect(v.respostas.map((r) => r.confirmado)).toEqual([true, false, false])
  })
  it('textoDaResposta so devolve texto confirmado no idioma pedido', () => {
    expect(textoDaResposta({ confirmado: true, textoPt: ' oi ', textoEn: undefined }, 'pt')).toBe('oi')
    expect(textoDaResposta({ confirmado: true, textoPt: 'oi' }, 'en')).toBeUndefined()
    expect(textoDaResposta({ confirmado: false, textoPt: 'oi' }, 'pt')).toBeUndefined()
  })
  it('campoUsavel exige confirmado e valor', () => {
    expect(campoUsavel({ confirmado: true, valor: 'x' })).toBe(true)
    expect(campoUsavel({ confirmado: true, valor: ' ' })).toBe(false)
    expect(campoUsavel({ confirmado: false, valor: 'x' })).toBe(false)
  })
  it('rejeita formato errado, chave repetida e curriculo que nao existe', () => {
    expect(validarPerfilJson(null).erros.length).toBeGreaterThan(0)
    expect(validarPerfilJson([]).erros.length).toBeGreaterThan(0)
    expect(validarPerfilJson({}).erros.length).toBeGreaterThan(0)
    expect(validarPerfilJson({ perfil: 'x' }).erros.length).toBeGreaterThan(0)
    expect(validarPerfilJson({ perfil: [{ chave: 'a', valor: '1' }, { chave: 'a', valor: '2' }] }).erros.length).toBe(1)
    expect(validarPerfilJson({ perfil: [{ valor: '1' }] }).erros.length).toBe(1)
    expect(validarPerfilJson({ curriculos: [{ chave: 'Outro' }] }).erros.length).toBe(1)
    expect(validarPerfilJson({ curriculos: [{ chave: 'EN-internacional', versao: '2' }] }).erros).toEqual([])
  })
})

describe('arquivo de exemplo', () => {
  it('o JSON de exemplo valida, e tudo nele nasce pendente (nada vira texto sem confirmar)', () => {
    const dados = JSON.parse(exemploRaw)
    const v = validarPerfilJson(dados)
    expect(v.erros).toEqual([])
    expect(v.campos.every((c) => !c.confirmado)).toBe(true)
    expect(v.respostas.every((r) => !r.confirmado)).toBe(true)
    expect(v.curriculos.map((c) => c.chave).sort()).toEqual(['EN-internacional', 'PT-brasil'])
  })
})

describe('Hoje', () => {
  it('conta aguardando aprovacao e aprovadas sem envio', () => {
    const r = resumoHojeCandidaturas([cand({ id: 1, status: 3 }), cand({ id: 2, status: 3 }), cand({ id: 3, status: 4 })], '2026-11-11')
    expect(r.aguardandoAprovacao).toBe(2)
    expect(r.aprovadasSemEnvio).toBe(1)
    expect(r.tudoEmDia).toBe(false)
  })
  it('follow-up vence no dia e antes, so em andamento (5 a 8)', () => {
    const r = resumoHojeCandidaturas([
      cand({ id: 1, status: 5, proximoFollowUp: '2026-11-10' }),
      cand({ id: 2, status: 7, proximoFollowUp: '2026-11-11' }),
      cand({ id: 3, status: 6, proximoFollowUp: '2026-11-12' }),
      cand({ id: 4, status: 10, proximoFollowUp: '2026-11-01' }),
      cand({ id: 5, status: 3, proximoFollowUp: '2026-11-01' }),
    ], '2026-11-11')
    expect(r.followUpsVencidos.map((f) => f.candidaturaId)).toEqual([1, 2])
  })
  it('sem nada pendente, tudo em dia', () => {
    expect(resumoHojeCandidaturas([], '2026-11-11').tudoEmDia).toBe(true)
  })
})

describe('contagens (so contagem, sem percentual)', () => {
  it('separa pendentes de resposta de resultado com avanco', () => {
    const vagas = [{ status: 1 }, { status: 2 }, { status: 3 }] as Vaga[]
    const cs = [5, 5, 6, 7, 8, 9, 10, 11, 3, 4].map((status, i) => cand({ id: i + 1, status: status as StatusCandidatura }))
    const c = contar(vagas, cs)
    expect(c.vagasNovas).toBe(2)
    expect(c.pendentesDeResposta).toBe(3)
    expect(c.comAvanco).toBe(3)
    expect(c.rejeitadas).toBe(1)
    expect(Object.keys(c).some((k) => /pct|taxa|conversao/i.test(k))).toBe(false)
  })
})
