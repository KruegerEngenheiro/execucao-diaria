// Folha de fechamento do dia. Mostra o resumo automatico e pede a reflexao.
import { useEffect, useState } from 'react'
import type { ResumoDiario } from '../types'
import { Folha, Anel } from '../componentes/comuns'
import { calcularScoreDoDia, fecharDia, tarefasDaData, resultadosDaData } from '../servicos'
import { formataMin } from '../logica/tempo'
import type { ComponenteScore } from '../logica/score'

export function FecharDia({ data, onFechar }: { data: string; onFechar: () => void }) {
  const [score, setScore] = useState<number | null>(null)
  const [componentes, setComponentes] = useState<ComponenteScore[]>([])
  const [resumoPreview, setResumoPreview] = useState<{ feitas: number; contadas: number; tempo: number; resultados: number; pendencias: string[] } | null>(null)
  const [conquistas, setConquistas] = useState('')
  const [aprendi, setAprendi] = useState('')
  const [melhorar, setMelhorar] = useState('')
  const [salvo, setSalvo] = useState<ResumoDiario | null>(null)

  useEffect(() => {
    let vivo = true
    Promise.all([calcularScoreDoDia(data), tarefasDaData(data), resultadosDaData(data)]).then(([s, tarefas, resultados]) => {
      if (!vivo) return
      setScore(s.score)
      setComponentes(s.componentes)
      const contadas = tarefas.filter((t) => t.status !== 'reagendada' && t.status !== 'cancelada')
      setResumoPreview({
        feitas: contadas.filter((t) => t.status === 'concluida').length,
        contadas: contadas.length,
        tempo: tarefas.reduce((acc, t) => acc + (t.duracaoReal || 0), 0),
        resultados: resultados.length,
        pendencias: contadas.filter((t) => t.status !== 'concluida').map((t) => t.titulo),
      })
    })
    return () => { vivo = false }
  }, [data])

  async function confirmar() {
    const r = await fecharDia(data, { conquistas, aprendi, melhorar })
    setSalvo(r)
  }

  if (salvo) {
    return (
      <Folha titulo="Dia fechado" onFechar={onFechar}>
        <div className="center" style={{ padding: '10px 0 20px' }}>
          <Anel valor={salvo.score} />
          <div className="mut mt">Score do dia</div>
          <div style={{ marginTop: 16, fontSize: 15 }}>
            {salvo.tarefasConcluidas} de {salvo.tarefasContadas} tarefas, {formataMin(salvo.tempoExecutadoMin)} executados.
          </div>
        </div>
        <button className="btn pri bloco" onClick={onFechar}>Pronto</button>
      </Folha>
    )
  }

  return (
    <Folha titulo="Fechar meu dia" onFechar={onFechar}>
      <div className="row" style={{ gap: 16, marginBottom: 8 }}>
        <Anel valor={score ?? 0} />
        <div className="sp">
          {resumoPreview && (
            <>
              <div><b>{resumoPreview.feitas}</b> de {resumoPreview.contadas} tarefas</div>
              <div className="mut">{formataMin(resumoPreview.tempo)} executados</div>
              <div className="mut">{resumoPreview.resultados} resultados registrados</div>
            </>
          )}
          {score === null && <div className="mut">Dia sem dados pra pontuar.</div>}
        </div>
      </div>

      {componentes.length > 0 && (
        <div className="cartao" style={{ background: 'var(--surface-2)' }}>
          <div className="titulo-secao" style={{ margin: '0 0 8px' }}>Como o score foi formado</div>
          {componentes.map((c) => (
            <div className="comp" key={c.nome}>
              <span className="nome">{c.nome}</span>
              <div className="barra"><i style={{ width: `${c.valor * 100}%` }} /></div>
              <span className="mut nowrap" style={{ fontSize: 11, minWidth: 54, textAlign: 'right' }}>peso {Math.round(c.pesoAplicado * 100)}%</span>
            </div>
          ))}
          <div className="mut" style={{ fontSize: 11.5, marginTop: 6 }}>
            Tarefa reagendada ou cancelada nao conta como falha.
          </div>
        </div>
      )}

      {resumoPreview && resumoPreview.pendencias.length > 0 && (
        <div className="aviso warn">Ficou pendente: {resumoPreview.pendencias.join(', ')}.</div>
      )}

      <div className="campo">
        <label>Principais conquistas</label>
        <input value={conquistas} onChange={(e) => setConquistas(e.target.value)} placeholder="O que valeu o dia" />
      </div>
      <div className="campo">
        <label>O que aprendi</label>
        <input value={aprendi} onChange={(e) => setAprendi(e.target.value)} placeholder="Opcional" />
      </div>
      <div className="campo">
        <label>O que melhorar amanha</label>
        <input value={melhorar} onChange={(e) => setMelhorar(e.target.value)} placeholder="Opcional" />
      </div>

      <button className="btn pri bloco" onClick={confirmar}>Fechar o dia</button>
    </Folha>
  )
}
