// Formulario de criar/editar tarefa, com sugestao de horario, checagem de conflito
// e aviso de sobrecarga. Nunca agenda por cima de rotina fixa nem do sono.
import { useEffect, useMemo, useState } from 'react'
import type { Tarefa, Prioridade, Meta } from '../types'
import { useCategorias } from '../hooks/useCategorias'
import { Folha } from './comuns'
import { Icon } from './Icon'
import { blocosParaData, tarefasDaData, criarTarefa, atualizarTarefa } from '../servicos'
import { db } from '../db'
import { sugerirHorarios, checarHorario, type Sugestao } from '../logica/planejador'
import { minParaHhmm, hhmmParaMin } from '../utils/datas'
import { useLiveQuery } from 'dexie-react-hooks'

const PRIORIDADES: Prioridade[] = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']
const ROTULO_PRIO: Record<Prioridade, string> = { CRITICA: 'Critica', ALTA: 'Alta', MEDIA: 'Media', BAIXA: 'Baixa' }
const DURACOES = [15, 30, 45, 60, 90, 120]

export function FormTarefa({ data, tarefa, onFechar }: { data: string; tarefa?: Tarefa; onFechar: () => void }) {
  const { lista: categorias, cor } = useCategorias()
  const metas = useLiveQuery(() => db.metas.where('status').equals('ativa').toArray(), [], [] as Meta[]) ?? []

  const [titulo, setTitulo] = useState(tarefa?.titulo ?? '')
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? '')
  const [categoria, setCategoria] = useState(tarefa?.categoria ?? 'Outros')
  const [prioridade, setPrioridade] = useState<Prioridade>(tarefa?.prioridade ?? 'MEDIA')
  const [duracao, setDuracao] = useState(tarefa?.duracaoEstimada ?? 30)
  const [agendar, setAgendar] = useState<boolean>(!!tarefa?.inicioPlanejado)
  const [inicio, setInicio] = useState(tarefa?.inicioPlanejado ?? '')
  const [prazo, setPrazo] = useState(tarefa?.prazo ?? '')
  const [metaId, setMetaId] = useState<number | undefined>(tarefa?.metaId)

  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [blocos, setBlocos] = useState<Awaited<ReturnType<typeof blocosParaData>>>([])
  const [tarefasDia, setTarefasDia] = useState<Tarefa[]>([])

  useEffect(() => {
    let vivo = true
    Promise.all([blocosParaData(data), tarefasDaData(data)]).then(([b, t]) => {
      if (!vivo) return
      setBlocos(b)
      setTarefasDia(t)
    })
    return () => { vivo = false }
  }, [data])

  useEffect(() => {
    if (agendar && duracao > 0 && blocos.length >= 0) {
      setSugestoes(sugerirHorarios(duracao, blocos, tarefasDia, 4))
    }
  }, [agendar, duracao, blocos, tarefasDia])

  const fim = inicio ? minParaHhmm(hhmmParaMin(inicio) + duracao) : ''

  const checagem = useMemo(() => {
    if (!agendar || !inicio) return null
    return checarHorario(inicio, fim, blocos, tarefasDia, tarefa?.id)
  }, [agendar, inicio, fim, blocos, tarefasDia, tarefa?.id])

  const podeSalvar = titulo.trim().length > 0 && (!agendar || !!inicio) && (!checagem || checagem.ok)

  async function salvar() {
    if (!podeSalvar) return
    const comum = {
      titulo, descricao, categoria, prioridade,
      duracaoEstimada: duracao,
      data: agendar || !prazo ? data : undefined,
      prazo: prazo || undefined,
      inicioPlanejado: agendar ? inicio : undefined,
      fimPlanejado: agendar ? fim : undefined,
      metaId,
    }
    if (tarefa?.id) {
      await atualizarTarefa(tarefa.id, comum)
    } else {
      await criarTarefa(comum)
    }
    onFechar()
  }

  return (
    <Folha titulo={tarefa ? 'Editar tarefa' : 'Nova tarefa'} onFechar={onFechar}>
      <div className="campo">
        <label>O que precisa fazer</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Mandar proposta pro cliente" autoFocus />
      </div>

      <div className="campo">
        <label>Categoria</label>
        <div className="chips">
          {categorias.map((c) => (
            <button
              key={c.id}
              className={`chip cat ${categoria === c.nome ? 'on' : ''}`}
              style={categoria === c.nome ? { background: c.cor } : undefined}
              onClick={() => setCategoria(c.nome)}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <label>Prioridade</label>
        <div className="chips">
          {PRIORIDADES.map((p) => (
            <button key={p} className={`chip ${prioridade === p ? 'on' : ''}`} onClick={() => setPrioridade(p)}>
              <span className={`prio ${p}`} style={{ display: 'inline-block', marginRight: 6 }} />
              {ROTULO_PRIO[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <label>Quanto tempo deve levar</label>
        <div className="chips">
          {DURACOES.map((d) => (
            <button key={d} className={`chip ${duracao === d ? 'on' : ''}`} onClick={() => setDuracao(d)}>
              {d < 60 ? `${d}min` : `${d / 60}h${d % 60 ? d % 60 : ''}`}
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <label>Quando</label>
        <div className="seg">
          <button className={agendar ? 'on' : ''} onClick={() => setAgendar(true)}>Agendar no dia</button>
          <button className={!agendar ? 'on' : ''} onClick={() => setAgendar(false)}>So com prazo</button>
        </div>
      </div>

      {agendar && (
        <>
          {sugestoes.length > 0 && !inicio && (
            <div className="campo">
              <label>Cabe nestes horarios</label>
              <div className="chips">
                {sugestoes.map((s, i) => (
                  <button key={i} className="chip" onClick={() => setInicio(s.inicio)}>
                    {s.inicio} {s.tipo === 'FLEXIVEL' ? '(brecha)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="campo">
            <label>Comeca as</label>
            <div className="row">
              <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} style={{ maxWidth: 140 }} />
              {inicio && <span className="mut">termina {fim}</span>}
            </div>
          </div>
          {checagem && !checagem.ok && (
            <div className={`aviso ${checagem.conflitos.some((c) => c.tipo === 'sono') ? 'erro' : 'warn'}`}>
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <Icon nome="alerta" tam={18} />
                <div>{checagem.mensagem}</div>
              </div>
            </div>
          )}
          {checagem && checagem.ok && inicio && (
            <div className="aviso ok"><Icon nome="check" tam={16} /> Esse horario esta livre.</div>
          )}
        </>
      )}

      {!agendar && (
        <div className="campo">
          <label>Prazo (opcional)</label>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
      )}

      {metas.length > 0 && (
        <div className="campo">
          <label>Ligar a uma meta (opcional)</label>
          <select value={metaId ?? ''} onChange={(e) => setMetaId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">Nenhuma</option>
            {metas.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}
          </select>
        </div>
      )}

      <div className="campo">
        <label>Detalhe (opcional)</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Qualquer observacao" />
      </div>

      <button className="btn pri bloco" disabled={!podeSalvar} onClick={salvar}>
        {tarefa ? 'Salvar' : 'Criar tarefa'}
      </button>
      <div style={{ height: 6 }} />
      <div className="center mut" style={{ fontSize: 12 }}>Cor da categoria: <span style={{ color: cor(categoria) }}>{categoria}</span></div>
    </Folha>
  )
}
