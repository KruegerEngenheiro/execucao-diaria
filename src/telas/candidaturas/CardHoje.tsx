// Card da tela Hoje: o que pede acao nas candidaturas. Some quando nao ha nada
// a fazer. Enquanto carrega, nao mostra nada (nunca um zero falso).
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { resumoHojeCandidaturas } from '../../logica/candidaturas/hoje'
import type { SubVagas } from './comum'

export function CardCandidaturasHoje({ data, ir }: { data: string; ir: (s: SubVagas) => void }) {
  const resumo = useLiveQuery(async () => {
    try { return resumoHojeCandidaturas(await db.candidaturas.toArray(), data) } catch { return null }
  }, [data])
  if (!resumo || resumo.tudoEmDia) return null

  const { aguardandoAprovacao: a, aprovadasSemEnvio: p, followUpsVencidos: f } = resumo
  return (
    <div className="cartao">
      <div className="row" style={{ marginBottom: 6 }}>
        <div className="titulo-secao sp" style={{ margin: 0 }}>Candidaturas</div>
      </div>
      {a > 0 && (
        <button className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => ir('aprovar')}>
          <div className="corpo"><div className="tit">{a} {a === 1 ? 'candidatura aguarda' : 'candidaturas aguardam'} sua aprovacao</div></div>
          <span className="link">Aprovar</span>
        </button>
      )}
      {p > 0 && (
        <button className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => ir('aprovar')}>
          <div className="corpo"><div className="tit">{p} aprovada(s) esperando voce enviar e registrar</div></div>
          <span className="link">Ver</span>
        </button>
      )}
      {f.length > 0 && (
        <button className="item" style={{ width: '100%', textAlign: 'left' }} onClick={() => ir('enviadas')}>
          <div className="corpo"><div className="tit">{f.length} {f.length === 1 ? 'follow-up vencido' : 'follow-ups vencidos'}</div></div>
          <span className="link">Ver</span>
        </button>
      )}
    </div>
  )
}
