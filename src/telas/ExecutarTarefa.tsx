// Folha de execucao de uma tarefa: cronometro vivo, iniciar/pausar, concluir com
// registro de resultado (texto e quantitativo), editar e excluir.
import { useState } from 'react'
import type { Tarefa, TipoResultado } from '../types'
import type { NovoResultado } from '../servicos'
import { Folha } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import { useRelogio } from '../hooks/useRelogio'
import { msDecorridos, relogio } from '../logica/tempo'
import { FormTarefa } from '../componentes/FormTarefa'
import { useCategorias } from '../hooks/useCategorias'

const TIPOS: { v: TipoResultado; r: string; u?: string }[] = [
  { v: 'dinheiro', r: 'Dinheiro', u: 'R$' },
  { v: 'quantidade', r: 'Quantidade' },
  { v: 'tempo', r: 'Tempo', u: 'min' },
  { v: 'entrega', r: 'Entrega' },
  { v: 'outro', r: 'Outro' },
]

export function ExecutarTarefa({
  tarefa, onFechar, onIniciar, onPausar, onConcluir, onExcluir,
}: {
  tarefa: Tarefa
  onFechar: () => void
  onIniciar: () => void
  onPausar: () => void
  onConcluir: (res?: NovoResultado) => void
  onExcluir: () => void
}) {
  const agora = useRelogio(tarefa.status === 'em_andamento')
  const { cor } = useCategorias()
  const [editando, setEditando] = useState(false)
  const [comResultado, setComResultado] = useState(false)
  const [tipo, setTipo] = useState<TipoResultado>('entrega')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')

  if (editando) {
    return <FormTarefa data={tarefa.data ?? ''} tarefa={tarefa} onFechar={() => { setEditando(false); onFechar() }} />
  }

  const ms = msDecorridos(tarefa, agora)
  const rodando = tarefa.status === 'em_andamento'

  function concluir() {
    let res: NovoResultado | undefined
    if (comResultado && (valor.trim() || descricao.trim())) {
      res = {
        tipo,
        valor: tipo === 'dinheiro' || tipo === 'quantidade' || tipo === 'tempo' ? Number(valor) || 0 : 1,
        unidade: TIPOS.find((t) => t.v === tipo)?.u,
        descricao: descricao.trim() || undefined,
        metaId: tarefa.metaId,
      }
    }
    onConcluir(res)
  }

  return (
    <Folha titulo={tarefa.titulo} onFechar={onFechar}>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="prio" style={{ background: cor(tarefa.categoria), width: 10, height: 10 }} />
        <span className="mut">{tarefa.categoria} · {tarefa.prioridade.toLowerCase()} · estimado {tarefa.duracaoEstimada}min</span>
      </div>
      {tarefa.descricao && <div className="mut" style={{ marginBottom: 14 }}>{tarefa.descricao}</div>}

      <div className="cartao" style={{ textAlign: 'center', background: 'var(--surface-2)' }}>
        <div className="big" style={{ fontSize: 52, fontVariantNumeric: 'tabular-nums' }}>{relogio(ms)}</div>
        <div className="mut" style={{ fontSize: 12, marginTop: 4 }}>tempo investido</div>
      </div>

      <div className="linha-btns mt">
        {rodando
          ? <button className="btn bloco" onClick={onPausar}><Icon nome="pause" tam={18} /> Pausar</button>
          : <button className="btn pri bloco" onClick={onIniciar}><Icon nome="play" tam={18} /> {tarefa.tempoAcumuladoMs > 0 ? 'Continuar' : 'Iniciar'}</button>}
      </div>

      <div className="campo mt">
        <div className="seg">
          <button className={!comResultado ? 'on' : ''} onClick={() => setComResultado(false)}>Concluir simples</button>
          <button className={comResultado ? 'on' : ''} onClick={() => setComResultado(true)}>Com resultado</button>
        </div>
      </div>

      {comResultado && (
        <div className="cartao" style={{ background: 'var(--surface-2)' }}>
          <div className="campo">
            <label>Tipo de resultado</label>
            <div className="chips">
              {TIPOS.map((t) => (
                <button key={t.v} className={`chip ${tipo === t.v ? 'on' : ''}`} onClick={() => setTipo(t.v)}>{t.r}</button>
              ))}
            </div>
          </div>
          {(tipo === 'dinheiro' || tipo === 'quantidade' || tipo === 'tempo') && (
            <div className="campo">
              <label>Valor {TIPOS.find((t) => t.v === tipo)?.u ? `(${TIPOS.find((t) => t.v === tipo)?.u})` : ''}</label>
              <input type="number" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0" />
            </div>
          )}
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Descricao</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Proposta enviada" />
          </div>
        </div>
      )}

      <button className="btn ok bloco mt" onClick={concluir}><Icon nome="check" tam={18} /> Concluir tarefa</button>

      <div className="linha-btns mt">
        <button className="btn" onClick={() => setEditando(true)}><Icon nome="editar" tam={16} /> Editar</button>
        <button className="btn perigo" onClick={() => { if (confirm('Excluir esta tarefa?')) onExcluir() }}><Icon nome="lixo" tam={16} /> Excluir</button>
      </div>
    </Folha>
  )
}
