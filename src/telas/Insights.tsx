// Tela Insights. Observacoes simples a partir do historico, so quando ha dados.
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { ResumoDiario, Resultado, Tarefa } from '../types'
import { Vazio } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import { gerarInsights } from '../logica/insights'
import { somaDias, hojeISO } from '../utils/datas'

export function Insights() {
  const desde = somaDias(hojeISO(), -30)
  const resumos = useLiveQuery(() => db.resumos.toArray(), [], [] as ResumoDiario[]) ?? []
  const resultados = useLiveQuery(() => db.resultados.where('data').aboveOrEqual(desde).toArray(), [desde], [] as Resultado[]) ?? []
  const tarefas = useLiveQuery(() => db.tarefas.where('data').aboveOrEqual(desde).toArray(), [desde], [] as Tarefa[]) ?? []

  const insights = gerarInsights({ resumos, resultados, tarefas })

  // Resumo de tempo por categoria dos ultimos 30 dias.
  const porCat = new Map<string, number>()
  for (const t of tarefas) if (t.duracaoReal > 0) porCat.set(t.categoria, (porCat.get(t.categoria) ?? 0) + t.duracaoReal)
  const ranking = [...porCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCat = ranking[0]?.[1] ?? 1

  return (
    <>
      <div className="cab">
        <h1>Insights</h1>
        <div className="sub">O que os seus dados mostram</div>
      </div>

      {insights.length === 0 ? (
        <Vazio icone="insights" texto="Feche alguns dias e os padroes vao aparecer aqui. Preciso de pelo menos tres dias fechados." />
      ) : (
        <div className="cartao">
          {insights.map((i, idx) => (
            <div className="item" key={idx} style={{ alignItems: 'center' }}>
              <Icon nome="insights" tam={18} />
              <div className="corpo">{i.texto}</div>
            </div>
          ))}
        </div>
      )}

      {ranking.length > 0 && (
        <>
          <div className="titulo-secao">Tempo por categoria, ultimos 30 dias</div>
          <div className="cartao">
            {ranking.map(([cat, min]) => (
              <div className="comp" key={cat}>
                <span className="nome">{cat}</span>
                <div className="barra"><i style={{ width: `${(min / maxCat) * 100}%` }} /></div>
                <span className="mut nowrap" style={{ minWidth: 48, textAlign: 'right', fontSize: 12 }}>{Math.floor(min / 60)}h{min % 60 ? String(min % 60).padStart(2, '0') : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
