// Tela Hoje. Responde na hora: o que acontece hoje, o que esta rolando agora,
// o que falta, e o que ja produzi.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import type { Tarefa, CarreiraProgresso } from '../types'
import { blocosParaData, tarefasDaData, registrosDaData, resultadosDaData, iniciarTimer, pausarTimer, concluirTarefa, marcarBloco, marcarCarreira } from '../servicos'
import { useCategorias } from '../hooks/useCategorias'
import { useRelogio } from '../hooks/useRelogio'
import { Barra } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import { saudacao } from '../logica/insights'
import { progressoDoDia } from '../logica/progresso'
import { atividadesDoDia, chaveCarreira } from '../logica/carreiraPlano'
import { ATIVIDADES_CARREIRA, INICIO_PLANO, FIM_PLANO, LABEL_CATEGORIA, type AtividadeCarreira } from '../dados/carreiraPlanoSeed'
import { copiarTexto } from '../utils/clipboard'
import { agoraMin, dataPorExtenso, nomeDiaLongo, hhmmParaMin } from '../utils/datas'
import { msDecorridos, relogio, formataDuracaoMs } from '../logica/tempo'
import { ExecutarTarefa } from './ExecutarTarefa'

export function Hoje({ data, irParaPlano }: { data: string; irParaPlano: () => void }) {
  const { cor } = useCategorias()
  const agora = useRelogio()
  const [execId, setExecId] = useState<number | null>(null)

  const blocos = useLiveQuery(() => blocosParaData(data), [data], [])
  const tarefas = useLiveQuery(() => tarefasDaData(data), [data], [] as Tarefa[])
  const registros = useLiveQuery(() => registrosDaData(data), [data], [])
  const resultados = useLiveQuery(() => resultadosDaData(data), [data], [])
  const carreiraProg = useLiveQuery(() => db.carreiraProgresso.toArray(), [], [] as CarreiraProgresso[])

  if (!blocos || !tarefas || !registros || !resultados || !carreiraProg) return null

  const feitosCarreira = new Set(carreiraProg.filter((c) => c.feito).map((c) => c.chave))
  const itensCarreira = atividadesDoDia(data, ATIVIDADES_CARREIRA, INICIO_PLANO, FIM_PLANO)
  const carreiraFeitas = itensCarreira.filter((a) => feitosCarreira.has(chaveCarreira(a.id, data))).length

  const minAgora = agoraMin(new Date(agora))
  const blocoAgora = blocos.find((b) => minAgora >= b.inicioMin && minAgora < b.fimMin)
  const blocoProximo = blocos.find((b) => b.inicioMin > minAgora)

  const contadas = tarefas.filter((t) => t.status !== 'reagendada' && t.status !== 'cancelada')
  const concluidas = contadas.filter((t) => t.status === 'concluida')
  const prog = progressoDoDia(blocos, tarefas, registros, { feitas: carreiraFeitas, total: itensCarreira.length })
  const pct = prog.pct

  const emAndamento = tarefas.find((t) => t.status === 'em_andamento')
  const execTarefa = execId != null ? tarefas.find((t) => t.id === execId) : undefined

  const totalGanhos = resultados.reduce((acc, r) => {
    if (r.tipo === 'dinheiro') acc.dinheiro += r.valor
    else acc.outros += 1
    return acc
  }, { dinheiro: 0, outros: 0 })
  const tempoFeito = tarefas.reduce((s, t) => s + (t.duracaoReal || 0), 0)

  const pendentes = tarefas
    .filter((t) => t.status === 'pendente' || t.status === 'pausada' || t.status === 'em_andamento')
    .sort((a, b) => hhmmParaMin(a.inicioPlanejado ?? '99:99') - hhmmParaMin(b.inicioPlanejado ?? '99:99'))

  async function toggleBloco(rotinaId: number, feito: boolean) {
    await marcarBloco(data, rotinaId, feito ? 'feito' : 'pendente')
  }

  return (
    <>
      <div className="cab">
        <h1>{saudacao(new Date(agora))}, Carlos</h1>
        <div className="sub">{nomeDiaLongo(data)}, {dataPorExtenso(data)}</div>
      </div>

      <div className="cartao">
        <div className="row">
          <div className="sp">
            <div className="titulo-secao" style={{ margin: '0 0 6px' }}>Progresso do dia</div>
            <Barra pct={pct} />
          </div>
          <div className="big" style={{ fontSize: 34, minWidth: 64, textAlign: 'right' }}>{pct}%</div>
        </div>
        <div className="mut" style={{ fontSize: 13, marginTop: 8 }}>
          {prog.feitas} de {prog.total} atividades do dia, cada uma conta
        </div>
      </div>

      {itensCarreira.length > 0 && (
        <div className="cartao">
          <div className="row" style={{ marginBottom: 6 }}>
            <div className="titulo-secao sp" style={{ margin: 0 }}>Carreira hoje</div>
            <button className="btn pequeno" onClick={irParaPlano}>Ver plano</button>
          </div>
          {itensCarreira.map((a) => (
            <CarreiraItem
              key={a.id}
              atividade={a}
              feito={feitosCarreira.has(chaveCarreira(a.id, data))}
              onToggle={(f) => marcarCarreira(a.id, data, f)}
            />
          ))}
        </div>
      )}

      {blocoAgora && (
        <div className="cartao agora">
          <span className="pill vivo"><span className="ponto" /> Agora</span>
          <div className="row" style={{ marginTop: 8 }}>
            <span className="dot-cat" style={{ background: cor(blocoAgora.categoria), marginTop: 0 }} />
            <div className="sp">
              <div className="tit" style={{ fontWeight: 700 }}>{blocoAgora.titulo}</div>
              <div className="meta">{blocoAgora.inicio} as {blocoAgora.fim}{blocoAgora.nota ? ` · ${blocoAgora.nota}` : ''}</div>
            </div>
            <span className={`tag-janela j-${blocoAgora.janela}`}>{blocoAgora.janela}</span>
          </div>
        </div>
      )}

      {blocoProximo && (
        <div className="cartao compacto">
          <div className="titulo-secao" style={{ margin: '0 0 6px' }}>Proxima</div>
          <div className="row">
            <span className="dot-cat" style={{ background: cor(blocoProximo.categoria), marginTop: 0 }} />
            <div className="sp">
              <div className="tit" style={{ fontWeight: 600 }}>{blocoProximo.titulo}</div>
              <div className="meta">{blocoProximo.inicio} as {blocoProximo.fim}</div>
            </div>
          </div>
        </div>
      )}

      {emAndamento && (
        <div className="cartao" style={{ borderColor: 'var(--accent)' }}>
          <div className="row">
            <div className="sp">
              <div className="titulo-secao" style={{ margin: 0 }}>Cronometro rodando</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{emAndamento.titulo}</div>
            </div>
            <div className="big" style={{ fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>
              {relogio(msDecorridos(emAndamento, agora))}
            </div>
          </div>
          <div className="linha-btns mt">
            <button className="btn" onClick={() => pausarTimer(emAndamento.id!)}><Icon nome="pause" tam={18} /> Pausar</button>
            <button className="btn ok" onClick={() => setExecId(emAndamento.id!)}><Icon nome="check" tam={18} /> Concluir</button>
          </div>
        </div>
      )}

      <div className="titulo-secao">Tarefas de hoje</div>
      {pendentes.length === 0 && concluidas.length === 0 ? (
        <div className="cartao"><div className="mut center">Nenhuma tarefa pra hoje ainda. Toque no + pra adicionar.</div></div>
      ) : (
        <div className="cartao">
          {pendentes.map((t) => (
            <div className="tarefa" key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <button className="check" onClick={() => setExecId(t.id!)} aria-label="Concluir">
                {t.status === 'em_andamento' && <span className="ponto" style={{ background: 'var(--accent)' }} />}
              </button>
              <div className="corpo" onClick={() => setExecId(t.id!)}>
                <div className="tit">{t.titulo}</div>
                <div className="linha-meta">
                  <span className="prio" style={{ background: cor(t.categoria) }} />
                  <span>{t.categoria}</span>
                  {t.inicioPlanejado && <span>· {t.inicioPlanejado}</span>}
                  <span>· {t.duracaoEstimada}min</span>
                  {t.tempoAcumuladoMs > 0 && <span>· feito {formataDuracaoMs(msDecorridos(t, agora))}</span>}
                </div>
              </div>
              {t.status === 'em_andamento'
                ? <button className="btn pequeno" onClick={() => pausarTimer(t.id!)}><Icon nome="pause" tam={16} /></button>
                : <button className="btn pequeno pri" onClick={() => iniciarTimer(t.id!)}><Icon nome="play" tam={16} /></button>}
            </div>
          ))}
          {concluidas.map((t) => (
            <div className="tarefa feita" key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="check on"><Icon nome="check" tam={16} /></div>
              <div className="corpo">
                <div className="tit">{t.titulo}</div>
                <div className="linha-meta"><span>{t.categoria}</span>{t.duracaoReal > 0 && <span>· {t.duracaoReal}min</span>}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="titulo-secao">Rotina de hoje</div>
      <div className="cartao">
        {blocos.length === 0 ? (
          <div className="mut center">Dia livre, sem rotina fixa hoje.</div>
        ) : blocos.map((b) => {
          const feito = registros.some((r) => r.rotinaId === b.rotinaId && r.status === 'feito')
          return (
            <div className="tarefa" key={b.rotinaId} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <button className={`check ${feito ? 'on' : ''}`} onClick={() => toggleBloco(b.rotinaId, !feito)} aria-label="Marcar atividade">
                {feito && <Icon nome="check" tam={16} />}
              </button>
              <div className="corpo" onClick={() => toggleBloco(b.rotinaId, !feito)} style={{ cursor: 'pointer' }}>
                <div className="tit" style={feito ? { color: 'var(--muted)' } : undefined}>{b.titulo}</div>
                <div className="linha-meta"><span className="prio" style={{ background: cor(b.categoria) }} /><span>{b.inicio} as {b.fim}</span>{b.nota ? <span>· {b.nota}</span> : null}</div>
              </div>
              <span className={`tag-janela j-${b.janela}`}>{b.janela}</span>
            </div>
          )
        })}
      </div>

      <div className="titulo-secao">O que ganhei hoje</div>
      <div className="cartao">
        <div className="kpis">
          <div className="kpi"><div className="v">{totalGanhos.dinheiro > 0 ? `R$${totalGanhos.dinheiro}` : '0'}</div><div className="r">dinheiro</div></div>
          <div className="kpi"><div className="v">{Math.floor(tempoFeito / 60)}h{tempoFeito % 60 ? String(tempoFeito % 60).padStart(2, '0') : ''}</div><div className="r">executado</div></div>
          <div className="kpi"><div className="v">{resultados.length}</div><div className="r">resultados</div></div>
        </div>
      </div>

      {execTarefa && (
        <ExecutarTarefa
          tarefa={execTarefa}
          onFechar={() => setExecId(null)}
          onIniciar={() => iniciarTimer(execTarefa.id!)}
          onPausar={() => pausarTimer(execTarefa.id!)}
          onConcluir={async (res) => { await concluirTarefa(execTarefa.id!, res); setExecId(null) }}
          onExcluir={async () => { await db.tarefas.delete(execTarefa.id!); setExecId(null) }}
        />
      )}
    </>
  )
}

// Item do Plano de carreira na tela Hoje. Uma tarefa so, marcavel. Quando tem
// checklist (a rotina de LinkedIn), texto de post ou aviso, abre o detalhe.
function CarreiraItem({
  atividade, feito, onToggle,
}: {
  atividade: AtividadeCarreira
  feito: boolean
  onToggle: (f: boolean) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const temDetalhe = !!atividade.checklist || !!atividade.textoPost || !!atividade.condicional || !!atividade.descricao

  async function copiar() {
    if (!atividade.textoPost) return
    const ok = await copiarTexto(atividade.textoPost)
    if (ok) { setCopiado(true); setTimeout(() => setCopiado(false), 1800) }
  }

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="tarefa" style={{ padding: 0 }}>
        <button className={`check ${feito ? 'on' : ''}`} onClick={() => onToggle(!feito)} aria-label="Marcar atividade">
          {feito && <Icon nome="check" tam={16} />}
        </button>
        <div className="corpo" onClick={() => (temDetalhe ? setAberto((v) => !v) : onToggle(!feito))} style={{ cursor: 'pointer' }}>
          <div className="tit" style={feito ? { color: 'var(--muted)' } : undefined}>{atividade.nome}</div>
          <div className="linha-meta">
            <span className="pill" style={{ background: 'var(--surface-2)', color: 'var(--muted)', flex: 'none' }}>{LABEL_CATEGORIA[atividade.categoria]}</span>
            <span>· {atividade.prioridade}</span>
          </div>
        </div>
        {temDetalhe && (
          <button className="btn pequeno" onClick={() => setAberto((v) => !v)} aria-label="Ver detalhe">
            <Icon nome="chevron" tam={16} />
          </button>
        )}
      </div>

      {aberto && (
        <div style={{ marginLeft: 34, marginTop: 6 }}>
          {atividade.descricao && <div className="mut" style={{ fontSize: 12.5, lineHeight: 1.45, marginBottom: 6 }}>{atividade.descricao}</div>}
          {atividade.condicional && (
            <div style={{ fontSize: 12.5, lineHeight: 1.4, marginBottom: 6, color: 'var(--accent)' }}>{atividade.condicional}</div>
          )}
          {atividade.checklist && (
            <ul style={{ margin: '0 0 4px', paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              {atividade.checklist.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
          {atividade.textoPost && (
            <button className="btn pequeno" onClick={copiar}><Icon nome="copiar" tam={15} /> {copiado ? 'Copiado' : 'Copiar texto do post'}</button>
          )}
        </div>
      )}
    </div>
  )
}
