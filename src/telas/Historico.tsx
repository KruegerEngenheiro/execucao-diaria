// Tela Historico. Calendario do mes e visao da semana, com score e progresso por dia.
// Tocar num dia abre o fechamento daquele dia.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import type { ResumoDiario } from '../types'
import { Folha, Anel } from '../componentes/comuns'
import { Vazio } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import {
  gradeDoMes, nomeMes, somaDias, hojeISO, diasDaSemana, nomeDiaCurto, diaDaSemana, dataPorExtenso, dataCurta,
} from '../utils/datas'
import { formataMin } from '../logica/tempo'
import { Insights } from './Insights'

function corScore(s: number): string {
  if (s >= 75) return 'var(--ok)'
  if (s >= 45) return 'var(--warn)'
  return 'var(--danger)'
}

export function Historico({ data }: { data: string }) {
  const [refMes, setRefMes] = useState(data)
  const [modo, setModo] = useState<'mes' | 'semana' | 'insights'>('mes')
  const [diaAberto, setDiaAberto] = useState<string | null>(null)

  const resumos = useLiveQuery(() => db.resumos.toArray(), [], [] as ResumoDiario[]) ?? []
  const mapa = new Map(resumos.map((r) => [r.data, r]))

  const grade = gradeDoMes(refMes)
  const semana = diasDaSemana(refMes)
  const DIAS_CAB = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <>
      <div className="cab">
        <h1>Historico</h1>
        <div className="sub">Seu rastro de execucao, dia a dia</div>
      </div>

      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={modo === 'mes' ? 'on' : ''} onClick={() => setModo('mes')}>Mes</button>
        <button className={modo === 'semana' ? 'on' : ''} onClick={() => setModo('semana')}>Semana</button>
        <button className={modo === 'insights' ? 'on' : ''} onClick={() => setModo('insights')}>Insights</button>
      </div>

      {modo === 'insights' ? (
        <Insights />
      ) : modo === 'mes' ? (
        <div className="cartao">
          <div className="cab-linha" style={{ marginBottom: 10 }}>
            <button className="btn pequeno" onClick={() => setRefMes(somaDias(refMes, -28))} aria-label="Mes anterior"><Icon nome="volta" tam={16} /></button>
            <b>{nomeMes(refMes)}</b>
            <button className="btn pequeno" onClick={() => setRefMes(somaDias(refMes, 28))} aria-label="Proximo mes"><Icon nome="chevron" tam={16} /></button>
          </div>
          <div className="cal">
            {DIAS_CAB.map((d, i) => <div className="dia-cab" key={i}>{d}</div>)}
            {grade.map((iso, i) => {
              if (!iso) return <div className="cel vazia" key={i} />
              const r = mapa.get(iso)
              const dia = Number(iso.slice(8))
              return (
                <button
                  key={i}
                  className={`cel ${iso === hojeISO() ? 'hoje' : ''}`}
                  onClick={() => r && setDiaAberto(iso)}
                  style={r ? { background: 'var(--surface-3)' } : undefined}
                >
                  <span>{dia}</span>
                  {r && <span className="mini" style={{ background: corScore(r.score) }} />}
                </button>
              )
            })}
          </div>
          <div className="row mt" style={{ gap: 14, justifyContent: 'center', fontSize: 11 }}>
            <span className="row" style={{ gap: 5 }}><span className="mini" style={{ background: 'var(--ok)', width: 8, height: 8, borderRadius: 9 }} /> bom</span>
            <span className="row" style={{ gap: 5 }}><span className="mini" style={{ background: 'var(--warn)', width: 8, height: 8, borderRadius: 9 }} /> medio</span>
            <span className="row" style={{ gap: 5 }}><span className="mini" style={{ background: 'var(--danger)', width: 8, height: 8, borderRadius: 9 }} /> fraco</span>
          </div>
        </div>
      ) : (
        <div className="cartao">
          <div className="cab-linha" style={{ marginBottom: 6 }}>
            <button className="btn pequeno" onClick={() => setRefMes(somaDias(refMes, -7))} aria-label="Semana anterior"><Icon nome="volta" tam={16} /></button>
            <b>{dataCurta(semana[0])} a {dataCurta(semana[6])}</b>
            <button className="btn pequeno" onClick={() => setRefMes(somaDias(refMes, 7))} aria-label="Proxima semana"><Icon nome="chevron" tam={16} /></button>
          </div>
          {semana.map((iso) => {
            const r = mapa.get(iso)
            return (
              <div className="semana-linha" key={iso} onClick={() => r && setDiaAberto(iso)}>
                <div className="d">{nomeDiaCurto(diaDaSemana(iso))}</div>
                <div className="sp">
                  {r ? (
                    <>
                      <div className="barra"><i style={{ width: `${r.percentualExecucao}%`, background: corScore(r.score) }} /></div>
                      <div className="mut" style={{ fontSize: 12, marginTop: 3 }}>{r.tarefasConcluidas}/{r.tarefasContadas} tarefas · {formataMin(r.tempoExecutadoMin)}</div>
                    </>
                  ) : (
                    <div className="mut" style={{ fontSize: 13 }}>{iso === hojeISO() ? 'hoje, ainda aberto' : 'nao fechado'}</div>
                  )}
                </div>
                {r && <div style={{ fontWeight: 800, color: corScore(r.score) }}>{r.score}</div>}
              </div>
            )
          })}
        </div>
      )}

      {modo !== 'insights' && resumos.length === 0 && <Vazio icone="historico" texto="Feche um dia na Agenda e ele aparece aqui." />}

      {diaAberto && <DetalheDia iso={diaAberto} resumo={mapa.get(diaAberto)!} onFechar={() => setDiaAberto(null)} />}
    </>
  )
}

function DetalheDia({ iso, resumo, onFechar }: { iso: string; resumo: ResumoDiario; onFechar: () => void }) {
  return (
    <Folha titulo={dataPorExtenso(iso)} onFechar={onFechar}>
      <div className="center" style={{ padding: '6px 0 14px' }}>
        <Anel valor={resumo.score} cor={corScore(resumo.score)} />
        <div className="mut mt">Score do dia</div>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="v">{resumo.percentualExecucao}%</div><div className="r">execucao</div></div>
        <div className="kpi"><div className="v">{resumo.tarefasConcluidas}/{resumo.tarefasContadas}</div><div className="r">tarefas</div></div>
        <div className="kpi"><div className="v">{formataMin(resumo.tempoExecutadoMin)}</div><div className="r">tempo</div></div>
      </div>
      {resumo.conquistas && <><div className="titulo-secao">Conquistas</div><div className="cartao">{resumo.conquistas}</div></>}
      {resumo.aprendi && <><div className="titulo-secao">O que aprendi</div><div className="cartao">{resumo.aprendi}</div></>}
      {resumo.melhorar && <><div className="titulo-secao">Melhorar amanha</div><div className="cartao">{resumo.melhorar}</div></>}
      {resumo.pendencias.length > 0 && <><div className="titulo-secao">Pendencias</div><div className="cartao mut">{resumo.pendencias.join(', ')}</div></>}
      {resumo.adiadas.length > 0 && <><div className="titulo-secao">Adiadas</div><div className="cartao mut">{resumo.adiadas.join(', ')}</div></>}
    </Folha>
  )
}
