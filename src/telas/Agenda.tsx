// Tela Agenda. Timeline do dia misturando rotina e tarefas agendadas, aviso de
// sobrecarga, navegacao entre dias e o botao de fechar o dia.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { Tarefa } from '../types'
import { blocosParaData, tarefasDaData, registrosDaData, resumoDaData, marcarBloco } from '../servicos'
import { situacaoCarga } from '../logica/planejador'
import { useCategorias } from '../hooks/useCategorias'
import { Icon } from '../componentes/Icon'
import { dataPorExtenso, nomeDiaLongo, somaDias, hojeISO, hhmmParaMin, agoraMin } from '../utils/datas'
import { formataMin } from '../logica/tempo'
import { FecharDia } from './FecharDia'

interface Linha {
  tipo: 'rotina' | 'tarefa'
  rotinaId?: number
  inicioMin: number
  inicio: string
  fim: string
  titulo: string
  categoria: string
  janela?: string
  nota?: string
  feito?: boolean
  statusTarefa?: string
}

export function Agenda({ data, setData }: { data: string; setData: (d: string) => void }) {
  const { cor } = useCategorias()
  const [fechando, setFechando] = useState(false)

  const blocos = useLiveQuery(() => blocosParaData(data), [data], [])
  const tarefas = useLiveQuery(() => tarefasDaData(data), [data], [] as Tarefa[])
  const registros = useLiveQuery(() => registrosDaData(data), [data], [])
  const resumo = useLiveQuery(() => resumoDaData(data), [data], undefined)

  if (!blocos || !tarefas || !registros) return null

  const carga = situacaoCarga(blocos, tarefas)
  const ehHoje = data === hojeISO()
  const minAgora = agoraMin()

  const linhas: Linha[] = []
  for (const b of blocos) {
    linhas.push({
      tipo: 'rotina', rotinaId: b.rotinaId, inicioMin: b.inicioMin, inicio: b.inicio, fim: b.fim,
      titulo: b.titulo, categoria: b.categoria, janela: b.janela, nota: b.nota,
      feito: registros.some((r) => r.rotinaId === b.rotinaId && r.status === 'feito'),
    })
  }
  for (const t of tarefas) {
    if (t.inicioPlanejado && t.status !== 'cancelada') {
      linhas.push({
        tipo: 'tarefa', inicioMin: hhmmParaMin(t.inicioPlanejado), inicio: t.inicioPlanejado,
        fim: t.fimPlanejado ?? '', titulo: t.titulo, categoria: t.categoria,
        statusTarefa: t.status,
      })
    }
  }
  linhas.sort((a, b) => a.inicioMin - b.inicioMin)

  const semHorario = tarefas.filter((t) => !t.inicioPlanejado && t.status !== 'cancelada' && t.status !== 'concluida')

  return (
    <>
      <div className="cab">
        <div className="cab-linha">
          <button className="btn pequeno" onClick={() => setData(somaDias(data, -1))} aria-label="Dia anterior"><Icon nome="volta" tam={18} /></button>
          <div className="center">
            <h1 style={{ fontSize: 20 }}>{nomeDiaLongo(data)}</h1>
            <div className="sub">{dataPorExtenso(data)}{ehHoje ? ', hoje' : ''}</div>
          </div>
          <button className="btn pequeno" onClick={() => setData(somaDias(data, 1))} aria-label="Proximo dia"><Icon nome="chevron" tam={18} /></button>
        </div>
      </div>

      {carga.sobrecarregado && (
        <div className="aviso warn">
          <div className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
            <Icon nome="alerta" tam={18} />
            <div>Seu planejamento passa do tempo disponivel em {formataMin(carga.excedeMin)}. Cabe {formataMin(carga.capacidadeMin)}, voce planejou {formataMin(carga.planejadoMin)}.</div>
          </div>
        </div>
      )}

      {linhas.length === 0 ? (
        <div className="cartao"><div className="mut center">Dia livre, sem rotina fixa. Toque no + pra planejar algo.</div></div>
      ) : (
        <div className="cartao">
          {linhas.map((l, i) => {
            const passou = ehHoje && l.inicioMin < minAgora
            const feito = !!l.feito || l.statusTarefa === 'concluida'
            const podeMarcar = l.tipo === 'rotina' && l.rotinaId != null
            return (
              <div
                className="item"
                key={i}
                style={{ opacity: feito ? 0.55 : passou ? 0.85 : 1, cursor: podeMarcar ? 'pointer' : undefined }}
                onClick={podeMarcar ? () => marcarBloco(data, l.rotinaId!, l.feito ? 'pendente' : 'feito') : undefined}
              >
                <div className="hora">{l.inicio}</div>
                <span className="dot-cat" style={{ background: cor(l.categoria) }} />
                <div className="corpo">
                  <div className="tit">
                    {l.titulo}
                    {l.tipo === 'tarefa' && <span className="mut" style={{ fontWeight: 400, fontSize: 12 }}> · tarefa</span>}
                  </div>
                  <div className="meta">
                    {l.inicio}{l.fim ? ` as ${l.fim}` : ''}{l.nota ? ` · ${l.nota}` : ''}
                    {feito && ' · feito'}
                  </div>
                </div>
                {feito
                  ? <span className="check on" style={{ flex: '0 0 auto' }}><Icon nome="check" tam={14} /></span>
                  : l.janela && <span className={`tag-janela j-${l.janela}`}>{l.janela}</span>}
              </div>
            )
          })}
        </div>
      )}

      {semHorario.length > 0 && (
        <>
          <div className="titulo-secao">Sem horario (so prazo)</div>
          <div className="cartao">
            {semHorario.map((t) => (
              <div className="item" key={t.id}>
                <span className="dot-cat" style={{ background: cor(t.categoria), marginTop: 2 }} />
                <div className="corpo">
                  <div className="tit">{t.titulo}</div>
                  <div className="meta">{t.categoria}{t.prazo ? ` · prazo ${t.prazo}` : ''} · {t.duracaoEstimada}min</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {resumo ? (
        <div className="aviso ok mt"><Icon nome="check" tam={16} /> Dia fechado com score {resumo.score}. Veja no Historico.</div>
      ) : (
        <button className="btn pri bloco mt" onClick={() => setFechando(true)}><Icon nome="fechar_dia" tam={18} /> Fechar meu dia</button>
      )}
      <div style={{ height: 8 }} />

      {fechando && <FecharDia data={data} onFechar={() => setFechando(false)} />}
    </>
  )
}
