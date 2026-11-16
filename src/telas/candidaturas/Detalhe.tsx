// Detalhe de uma candidatura. Em 3 e 4 e a TELA DE APROVACAO (trava 2): mostra empresa,
// cargo, resumo, nota, curriculo, respostas, pendentes e link, com as 5 acoes.
// Depois do envio vira acompanhamento (marcos, notas, follow-up).
// O app nunca envia nada: "Registrar envio" e a confirmacao de que o Carlos enviou.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db'
import type { Candidatura, Vaga, RespostaBase, RespostaCandidatura } from '../../types'
import { Folha, ConfirmaAcao, Carregando, ErroBloco } from '../../componentes/comuns'
import {
  aprovarCandidatura, adiarCandidatura, registrarEnvio, rejeitarCandidatura, editarCandidatura,
  registrarMarco, registrarEvento, definirFollowUp, mudarStatus, RegraViolada, MARCO_STATUS, type Marco,
} from '../../servicos/candidaturas'
import { podeTransitar } from '../../logica/candidaturas/status'
import { usarBase, idiomaDaVaga } from '../../logica/candidaturas/perfil'
import { hojeISO } from '../../utils/datas'
import { ELEGIBILIDADE_ROTULO, LinkExterno, Pill, StatusPill, dataBR, msde } from './comum'

type Confirma = 'aprovar' | 'rejeitar' | 'envio' | 'encerrar' | null
type Sub = 'editar' | 'curriculo' | 'registrar' | null

const msgErro = (e: unknown) => (e instanceof RegraViolada ? e.message : 'Nao consegui concluir. Tente de novo.')

export function Detalhe({ id, onFechar }: { id: number; onFechar: () => void }) {
  const [tentativa, setTentativa] = useState(0)
  const dados = useLiveQuery(async () => {
    try {
      const c = await db.candidaturas.get(id)
      if (!c) return { vazio: true as const }
      const [vaga, curriculos, eventos, bases] = await Promise.all([
        db.vagas.get(c.vagaId), db.curriculos.toArray(),
        db.eventosCandidatura.where('candidaturaId').equals(id).sortBy('em'), db.respostasBase.toArray(),
      ])
      return { vazio: false as const, c, vaga, curriculos, eventos, bases }
    } catch {
      return { falhou: true as const }
    }
  }, [id, tentativa])
  const [confirma, setConfirma] = useState<Confirma>(null)
  const [sub, setSub] = useState<Sub>(null)
  const [erro, setErro] = useState('')

  if (!dados) return <Folha titulo="Candidatura" onFechar={onFechar}><Carregando /></Folha>
  if ('falhou' in dados) {
    return <Folha titulo="Candidatura" onFechar={onFechar}><ErroBloco texto="Nao consegui ler essa candidatura deste aparelho." onTentar={() => setTentativa((n) => n + 1)} /></Folha>
  }
  if (dados.vazio || !dados.vaga) {
    return <Folha titulo="Candidatura" onFechar={onFechar}><ErroBloco texto="Nao encontrei essa candidatura." /></Folha>
  }
  const { c, vaga, curriculos, eventos, bases } = dados
  const cv = curriculos.find((x) => x.id === c.curriculoId)

  async function rodar(fn: () => Promise<unknown>, fechar = false) {
    setErro('')
    try { await fn(); if (fechar) onFechar() } catch (e) { setErro(msgErro(e)) }
  }

  const aprovacao = c.status === 3 || c.status === 4
  return (
    <Folha titulo={aprovacao ? 'Aprovar candidatura' : 'Candidatura'} onFechar={onFechar}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="sp">
          <div style={{ fontWeight: 800, fontSize: 17 }}>{vaga.cargo}</div>
          <div className="mut" style={{ fontSize: 14 }}>{vaga.empresa}{vaga.pais ? ` · ${vaga.pais}` : ''}</div>
        </div>
        <StatusPill status={c.status} />
      </div>
      <div className="linha-meta">
        <Pill cor={vaga.elegibilidade === 'desconhecida' ? 'warn' : 'accent'} texto={ELEGIBILIDADE_ROTULO[vaga.elegibilidade]} />
        <span>{vaga.plataforma}</span>
        {vaga.faixaSalarial && <span>{vaga.faixaSalarial}</span>}
      </div>
      {vaga.elegibilidadeEvidencia && <div className="mut" style={{ fontSize: 12.5, marginTop: 6 }}>Evidencia: "{vaga.elegibilidadeEvidencia}"</div>}
      <div style={{ marginTop: 10 }}><LinkExterno url={vaga.url} classe="btn pequeno" rotulo="Abrir a vaga" /></div>

      {aprovacao && <ResumoPeca c={c} vaga={vaga} cvRotulo={cv?.rotulo} />}
      {!aprovacao && cv && <div className="mut" style={{ fontSize: 13, marginTop: 10 }}>Curriculo usado: {cv.rotulo}</div>}

      {erro && <div className="aviso erro mt" role="alert">{erro}</div>}

      {c.status === 3 && (
        <div className="mt">
          <div className="linha-btns">
            <button className="btn ok" onClick={() => setConfirma('aprovar')}>Aprovar</button>
            <button className="btn" onClick={() => setSub('editar')}>Editar</button>
          </div>
          <div className="linha-btns" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => setSub('curriculo')}>Trocar curriculo</button>
            <button className="btn perigo" onClick={() => setConfirma('rejeitar')}>Rejeitar</button>
          </div>
          <button className="btn bloco" style={{ marginTop: 10 }} onClick={() => rodar(() => adiarCandidatura(c.id!), true)}>Salvar para depois</button>
        </div>
      )}

      {c.status === 4 && (
        <div className="mt">
          <div className="aviso ok">
            Aprovada em {dataBR(c.aprovadaEm ?? 0)}. O app nao envia nada. Abra a vaga, envie voce mesmo e depois registre o envio aqui.
          </div>
          <div className="linha-btns">
            <LinkExterno url={vaga.url} classe="btn" rotulo="Abrir a vaga" />
            <button className="btn pri" onClick={() => setConfirma('envio')}>Registrar envio</button>
          </div>
          <div className="linha-btns" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => setSub('editar')}>Editar</button>
            <button className="btn perigo" onClick={() => setConfirma('rejeitar')}>Rejeitar</button>
          </div>
          <div className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>Editar ou trocar o curriculo cancela a aprovacao e volta para Aprovar.</div>
        </div>
      )}

      {c.status >= 5 && <Acompanhamento c={c} eventos={eventos} onRegistrar={() => setSub('registrar')} onEncerrar={() => setConfirma('encerrar')} rodar={rodar} />}

      {confirma === 'aprovar' && (
        <ConfirmaAcao
          titulo="Aprovar candidatura" rotuloConfirmar="Aprovar"
          texto={c.camposPendentes.length > 0
            ? `Ha ${c.camposPendentes.length} campo(s) pendente(s) de confirmacao: ${c.camposPendentes.join(', ')}. Aprovar mesmo assim? Eles nao entram como texto.`
            : 'Aprovar libera o registro do envio. Nada e enviado pelo app.'}
          onCancelar={() => setConfirma(null)}
          onConfirmar={async () => { await aprovarCandidatura(c.id!, { ciente: c.camposPendentes.length > 0 }); setConfirma(null) }}
        />
      )}
      {confirma === 'rejeitar' && (
        <ConfirmaAcao
          titulo="Rejeitar candidatura" perigo rotuloConfirmar="Rejeitar"
          texto={c.enviadaEm
            ? 'Essa candidatura vai para o Historico como rejeitada pela empresa. Isso nao pode ser desfeito.'
            : 'Essa candidatura ainda nao foi enviada. Ela vai para o Historico como desistencia. Isso nao pode ser desfeito.'}
          onCancelar={() => setConfirma(null)}
          onConfirmar={async () => { await rejeitarCandidatura(c.id!); onFechar() }}
        />
      )}
      {confirma === 'envio' && (
        <ConfirmaAcao
          titulo="Registrar envio" rotuloConfirmar="Sim, eu enviei"
          texto="Confirme que VOCE enviou esta candidatura no site da empresa. O app nao envia nada, so registra a data de hoje."
          onCancelar={() => setConfirma(null)}
          onConfirmar={async () => { await registrarEnvio(c.id!); setConfirma(null) }}
        />
      )}
      {confirma === 'encerrar' && (
        <ConfirmaAcao
          titulo="Encerrar" perigo rotuloConfirmar="Encerrar"
          texto="Encerrar tira essa candidatura do acompanhamento."
          onCancelar={() => setConfirma(null)}
          onConfirmar={async () => { await mudarStatus(c.id!, 11); onFechar() }}
        />
      )}

      {sub === 'editar' && <Editor c={c} vaga={vaga} bases={bases} onFechar={() => setSub(null)} />}
      {sub === 'curriculo' && (
        <Folha titulo="Trocar curriculo" onFechar={() => setSub(null)}>
          <div className="chips" style={{ marginBottom: 14 }}>
            {curriculos.map((x) => (
              <button key={x.id} className={`chip ${c.curriculoId === x.id ? 'on' : ''}`}
                onClick={() => rodar(async () => { await editarCandidatura(c.id!, { curriculoId: x.id }); setSub(null) })}>{x.rotulo}</button>
            ))}
          </div>
        </Folha>
      )}
      {sub === 'registrar' && <Registrar c={c} onFechar={() => setSub(null)} />}
    </Folha>
  )
}

function ResumoPeca({ c, vaga, cvRotulo }: { c: Candidatura; vaga: Vaga; cvRotulo?: string }) {
  const resumo = (vaga.descricao ?? '').slice(0, 500)
  return (
    <>
      <div className="titulo-secao">Resumo da vaga</div>
      <div style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap' }} className="mut">
        {resumo ? `${resumo}${(vaga.descricao ?? '').length > 500 ? '...' : ''}` : 'Sem texto da vaga cadastrado.'}
      </div>
      {vaga.obrigatorios.length > 0 && <div className="mut" style={{ fontSize: 13, marginTop: 6 }}>Obrigatorios: {vaga.obrigatorios.join('; ')}</div>}

      <div className="titulo-secao">Nota de compatibilidade</div>
      <div className="mut" style={{ fontSize: 14 }}>{vaga.score != null ? `${vaga.score} de 100` : 'Ainda sem nota. O calculo vem numa proxima etapa. Decida pelo seu criterio.'}</div>

      <div className="titulo-secao">Curriculo</div>
      {cvRotulo ? <div style={{ fontWeight: 600 }}>{cvRotulo}</div> : <div className="aviso warn">Nenhum curriculo escolhido. Use Trocar curriculo antes de aprovar.</div>}

      <div className="titulo-secao">Respostas</div>
      {c.respostas.length === 0 && <div className="mut" style={{ fontSize: 14 }}>Nenhuma resposta preparada.</div>}
      {c.respostas.map((r, i) => (
        <div key={i} className="cartao compacto" style={{ marginBottom: 8 }}>
          <div className="row"><div className="sp" style={{ fontWeight: 600, fontSize: 14 }}>{r.pergunta}</div>
            <Pill cor={r.confirmado ? 'ok' : 'warn'} texto={r.confirmado ? 'confirmada' : 'pendente'} /></div>
          <div className="mut" style={{ fontSize: 13.5, marginTop: 4, whiteSpace: 'pre-wrap' }}>{r.texto}</div>
        </div>
      ))}
      {c.camposPendentes.length > 0 && (
        <div className="aviso warn">Pendente de confirmacao: {c.camposPendentes.join(', ')}. Nenhum desses campos vira texto da candidatura.</div>
      )}
    </>
  )
}

function Acompanhamento({ c, eventos, onRegistrar, onEncerrar, rodar }: {
  c: Candidatura
  eventos: { id?: number; tipo: string; em: number; texto?: string }[]
  onRegistrar: () => void
  onEncerrar: () => void
  rodar: (fn: () => Promise<unknown>) => Promise<void>
}) {
  const [fu, setFu] = useState(c.proximoFollowUp ?? '')
  const emAndamento = c.status >= 5 && c.status <= 8
  return (
    <>
      {emAndamento && (
        <div className="mt">
          <button className="btn pri bloco" onClick={onRegistrar}>Registrar avanco ou nota</button>
          <div className="campo" style={{ marginTop: 14 }}>
            <label>Proximo follow-up</label>
            <div className="row">
              <input type="date" value={fu} onChange={(e) => setFu(e.target.value)} style={{ flex: 1 }} />
              <button className="btn pequeno" onClick={() => rodar(() => definirFollowUp(c.id!, fu || undefined))}>Salvar</button>
            </div>
          </div>
        </div>
      )}
      {(c.status === 9 || c.status === 10) && <button className="btn bloco mt" onClick={onEncerrar}>Encerrar</button>}
      <div className="titulo-secao">Historico</div>
      {eventos.map((e, i) => (
        <div className="item" key={e.id ?? i}>
          <div className="hora">{dataBR(e.em)}</div>
          <div className="corpo"><div className="tit" style={{ fontSize: 14 }}>{ROTULO_EVENTO[e.tipo] ?? e.tipo}</div>
            {e.texto && <div className="meta">{e.texto}</div>}</div>
        </div>
      ))}
    </>
  )
}

const ROTULO_EVENTO: Record<string, string> = {
  criada: 'Candidatura criada', editada: 'Editada', aprovada: 'Aprovada por voce', aprovacao_revogada: 'Aprovacao cancelada',
  adiada: 'Salva para depois', envio: 'Envio registrado', avaliacao: 'Em avaliacao', entrevista: 'Entrevista',
  teste_tecnico: 'Teste tecnico', contato_recrutador: 'Contato com recrutador', aprovado: 'Aprovado', rejeicao: 'Rejeitada',
  encerrada: 'Encerrada', followup: 'Follow-up feito', nota: 'Nota', status: 'Status alterado',
}

// Registra um avanco (marco) ou uma nota livre.
function Registrar({ c, onFechar }: { c: Candidatura; onFechar: () => void }) {
  const marcos = (Object.keys(MARCO_STATUS) as Marco[]).filter((m) => MARCO_STATUS[m] === c.status || podeTransitar(c.status, MARCO_STATUS[m]))
  type Tipo = Marco | 'nota' | 'contato_recrutador'
  const [tipo, setTipo] = useState<Tipo>(marcos[0] ?? 'nota')
  const [texto, setTexto] = useState('')
  const [data, setData] = useState(hojeISO())
  const [fu, setFu] = useState('')
  const [qualificada, setQualificada] = useState(true)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const ehMarco = tipo !== 'nota' && tipo !== 'contato_recrutador'

  async function salvar() {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      const em = data === hojeISO() ? undefined : msde(data)
      if (ehMarco) await registrarMarco(c.id!, tipo as Marco, { texto, em, proximoFollowUp: fu || undefined, qualificada })
      else await registrarEvento(c.id!, tipo as 'nota' | 'contato_recrutador', texto, em)
      onFechar()
    } catch (e) {
      setErro(msgErro(e))
      setOcupado(false)
    }
  }

  const rotulo: Record<string, string> = {
    avaliacao: 'Em avaliacao', entrevista: 'Entrevista', teste_tecnico: 'Teste tecnico', aprovado: 'Aprovado',
    rejeicao: 'Rejeitado', encerrada: 'Encerrar', nota: 'Nota', contato_recrutador: 'Contato',
  }
  return (
    <Folha titulo="Registrar" onFechar={onFechar}>
      <div className="chips" style={{ marginBottom: 14 }}>
        {[...marcos, 'nota', 'contato_recrutador'].map((m) => (
          <button key={m} className={`chip ${tipo === m ? 'on' : ''}`} onClick={() => setTipo(m as Tipo)}>{rotulo[m]}</button>
        ))}
      </div>
      <div className="campo"><label>Data</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
      <div className="campo"><label>O que aconteceu</label><textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} /></div>
      {ehMarco && tipo !== 'aprovado' && tipo !== 'rejeicao' && tipo !== 'encerrada' && (
        <div className="campo"><label>Proximo follow-up (opcional)</label><input type="date" value={fu} onChange={(e) => setFu(e.target.value)} /></div>
      )}
      {tipo === 'entrevista' && (
        <label className="row" style={{ marginBottom: 14, fontSize: 14 }}>
          <input type="checkbox" checked={qualificada} onChange={(e) => setQualificada(e.target.checked)} style={{ width: 20, height: 20 }} />
          <span>Conta como entrevista qualificada (meta)</span>
        </label>
      )}
      {erro && <div className="aviso erro" role="alert">{erro}</div>}
      <button className="btn pri bloco" onClick={salvar} disabled={ocupado}>{ocupado ? 'Salvando...' : 'Salvar'}</button>
    </Folha>
  )
}

// Editor da peca (respostas e pendentes). Trabalha em rascunho e so grava ao salvar.
// Texto que vem da central de dados so entra se for confirmado (trava 1).
function Editor({ c, vaga, bases, onFechar }: { c: Candidatura; vaga: Vaga; bases: RespostaBase[]; onFechar: () => void }) {
  const [respostas, setRespostas] = useState<RespostaCandidatura[]>(c.respostas)
  const [pendentes, setPendentes] = useState<string[]>(c.camposPendentes)
  const [pergunta, setPergunta] = useState('')
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const idioma = idiomaDaVaga(vaga.idioma)

  function daBase(b: RespostaBase) {
    setInfo('')
    const uso = usarBase(b, idioma)
    if (uso.tipo === 'ok') {
      if (respostas.some((r) => r.pergunta === uso.resposta.pergunta)) { setInfo('Essa resposta ja esta na lista.'); return }
      setRespostas([...respostas, uso.resposta])
    } else {
      if (!pendentes.includes(b.rotulo)) setPendentes([...pendentes, b.rotulo])
      setInfo(`${b.rotulo}: ${uso.motivo} Ficou como pendente, nao entra como texto.`)
    }
  }
  function editarTexto(i: number, t: string) {
    // Texto alterado a mao passa a ser do Carlos (manual), confirmado por ele.
    setRespostas(respostas.map((r, k) => (k === i ? { ...r, texto: t, origem: 'manual', confirmado: true } : r)))
  }
  function adicionar() {
    if (!pergunta.trim() || !texto.trim()) return
    setRespostas([...respostas, { pergunta: pergunta.trim(), texto: texto.trim(), origem: 'manual', confirmado: true }])
    setPergunta('')
    setTexto('')
  }
  async function salvar() {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      await editarCandidatura(c.id!, { respostas, camposPendentes: pendentes })
      onFechar()
    } catch (e) {
      setErro(msgErro(e))
      setOcupado(false)
    }
  }

  return (
    <Folha titulo="Editar candidatura" onFechar={onFechar}>
      {c.status === 4 && <div className="aviso warn">Salvar cancela a aprovacao. Voce vai precisar aprovar de novo.</div>}

      <div className="titulo-secao" style={{ marginTop: 0 }}>Respostas</div>
      {respostas.length === 0 && <div className="mut" style={{ fontSize: 14, marginBottom: 8 }}>Nenhuma resposta ainda.</div>}
      {respostas.map((r, i) => (
        <div key={i} className="cartao compacto">
          <div className="row"><div className="sp" style={{ fontWeight: 600, fontSize: 14 }}>{r.pergunta}</div>
            <button className="btn pequeno perigo" onClick={() => setRespostas(respostas.filter((_, k) => k !== i))} aria-label="Remover resposta">Remover</button></div>
          <div className="campo" style={{ marginTop: 8, marginBottom: 0 }}>
            <textarea value={r.texto} onChange={(e) => editarTexto(i, e.target.value)} maxLength={5000} />
          </div>
          <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>{r.origem === 'base' ? 'Da central de dados' : 'Escrita por voce'}</div>
        </div>
      ))}

      <div className="titulo-secao">Nova resposta</div>
      <div className="campo"><label>Pergunta</label><input value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={500} /></div>
      <div className="campo"><label>Resposta</label><textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={5000} /></div>
      <button className="btn bloco" onClick={adicionar}>Adicionar resposta</button>

      <div className="titulo-secao">Central de dados</div>
      {bases.length === 0 && <div className="mut" style={{ fontSize: 13.5 }}>Vazia. Importe seu perfil em Configuracoes.</div>}
      {bases.map((b) => (
        <div className="item" key={b.id}>
          <div className="corpo"><div className="tit" style={{ fontSize: 14 }}>{b.rotulo}</div>
            <div className="meta">{b.confirmado ? 'confirmada' : 'pendente de confirmacao'}</div></div>
          <button className="btn pequeno" onClick={() => daBase(b)}>{b.confirmado ? 'Usar' : 'Marcar pendente'}</button>
        </div>
      ))}
      {info && <div className="aviso warn mt">{info}</div>}

      {pendentes.length > 0 && (
        <>
          <div className="titulo-secao">Campos pendentes</div>
          <div className="chips">
            {pendentes.map((p) => (
              <button key={p} className="chip on" style={{ background: 'var(--warn)' }} onClick={() => setPendentes(pendentes.filter((x) => x !== p))}>{p} (resolvido)</button>
            ))}
          </div>
          <div className="mut" style={{ fontSize: 12.5, marginTop: 6 }}>Toque no campo so quando voce mesmo ja resolveu.</div>
        </>
      )}

      {erro && <div className="aviso erro mt" role="alert">{erro}</div>}
      <button className="btn pri bloco mt" onClick={salvar} disabled={ocupado}>{ocupado ? 'Salvando...' : 'Salvar'}</button>
    </Folha>
  )
}
