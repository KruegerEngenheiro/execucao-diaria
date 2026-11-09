// Tela Metas. Criar metas e acompanhar o avanco. Metas com tipo somam resultados
// automaticamente; as demais podem receber avanco manual.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import type { Meta, TipoResultado } from '../types'
import { Folha, Barra, Vazio } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import { criarMeta, adicionarResultado } from '../servicos'
import { useCategorias } from '../hooks/useCategorias'

const TIPOS: { v: TipoResultado | ''; r: string }[] = [
  { v: '', r: 'Manual' },
  { v: 'dinheiro', r: 'Dinheiro' },
  { v: 'quantidade', r: 'Quantidade' },
  { v: 'tempo', r: 'Tempo' },
  { v: 'entrega', r: 'Entregas' },
]

export function Metas() {
  const metas = useLiveQuery(() => db.metas.toArray(), [], [] as Meta[]) ?? []
  const [novo, setNovo] = useState(false)
  const ativas = metas.filter((m) => m.status !== 'concluida')
  const feitas = metas.filter((m) => m.status === 'concluida')

  return (
    <>
      <div className="cab">
        <div className="cab-linha">
          <div>
            <h1>Metas</h1>
            <div className="sub">Pra onde o esforco aponta</div>
          </div>
          <button className="btn pri pequeno" onClick={() => setNovo(true)}><Icon nome="mais" tam={16} /> Nova</button>
        </div>
      </div>

      {metas.length === 0 && <Vazio icone="metas" texto="Crie sua primeira meta. Ex: 20 horas de IA no mes." />}

      {ativas.map((m) => <CartaoMeta key={m.id} meta={m} />)}

      {feitas.length > 0 && (
        <>
          <div className="titulo-secao">Concluidas</div>
          {feitas.map((m) => <CartaoMeta key={m.id} meta={m} />)}
        </>
      )}

      {novo && <FormMeta onFechar={() => setNovo(false)} />}
    </>
  )
}

function CartaoMeta({ meta }: { meta: Meta }) {
  const { cor } = useCategorias()
  const [addVal, setAddVal] = useState(false)
  const [valor, setValor] = useState('')
  const pct = meta.alvo > 0 ? Math.round((meta.atual / meta.alvo) * 100) : 0

  async function somar() {
    const v = Number(valor)
    if (!v || !meta.id) return
    await adicionarResultado({
      tipo: meta.tipoResultado ?? 'quantidade',
      valor: v,
      unidade: meta.unidade,
      metaId: meta.id,
      categoria: meta.categoria,
      descricao: `Avanco da meta ${meta.titulo}`,
    })
    setValor(''); setAddVal(false)
  }

  return (
    <div className="cartao">
      <div className="row" style={{ marginBottom: 8 }}>
        {meta.categoria && <span className="prio" style={{ background: cor(meta.categoria), width: 9, height: 9 }} />}
        <b className="sp">{meta.titulo}</b>
        <span className="mut nowrap">{meta.atual} / {meta.alvo} {meta.unidade}</span>
      </div>
      <Barra pct={pct} />
      <div className="row mt" style={{ justifyContent: 'space-between' }}>
        <span className="mut" style={{ fontSize: 12 }}>
          {meta.status === 'concluida' ? 'Concluida' : `${pct}%`}
          {meta.tipoResultado ? ' · soma automatica' : ''}
        </span>
        {meta.status !== 'concluida' && !meta.tipoResultado && (
          addVal
            ? <span className="row" style={{ gap: 6 }}>
                <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} style={{ width: 70, padding: '6px 8px' }} placeholder="+" />
                <button className="btn pequeno pri" onClick={somar}>Somar</button>
              </span>
            : <button className="btn pequeno" onClick={() => setAddVal(true)}>Registrar avanco</button>
        )}
      </div>
    </div>
  )
}

function FormMeta({ onFechar }: { onFechar: () => void }) {
  const { lista } = useCategorias()
  const [titulo, setTitulo] = useState('')
  const [alvo, setAlvo] = useState('')
  const [unidade, setUnidade] = useState('')
  const [categoria, setCategoria] = useState('')
  const [tipo, setTipo] = useState<TipoResultado | ''>('')

  async function salvar() {
    if (!titulo.trim() || !Number(alvo)) return
    await criarMeta({
      titulo: titulo.trim(),
      alvo: Number(alvo),
      unidade: unidade.trim() || 'un',
      categoria: categoria || undefined,
      tipoResultado: tipo || undefined,
    })
    onFechar()
  }

  return (
    <Folha titulo="Nova meta" onFechar={onFechar}>
      <div className="campo"><label>Meta</label><input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: 20 horas de IA no mes" autoFocus /></div>
      <div className="grade-2">
        <div className="campo"><label>Alvo</label><input type="number" value={alvo} onChange={(e) => setAlvo(e.target.value)} placeholder="20" /></div>
        <div className="campo"><label>Unidade</label><input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="horas, clientes..." /></div>
      </div>
      <div className="campo">
        <label>Categoria (opcional)</label>
        <div className="chips">
          {lista.map((c) => <button key={c.id} className={`chip ${categoria === c.nome ? 'on' : ''}`} onClick={() => setCategoria(categoria === c.nome ? '' : c.nome)}>{c.nome}</button>)}
        </div>
      </div>
      <div className="campo">
        <label>Como contar o avanco</label>
        <div className="chips">
          {TIPOS.map((t) => <button key={t.v} className={`chip ${tipo === t.v ? 'on' : ''}`} onClick={() => setTipo(t.v)}>{t.r}</button>)}
        </div>
        <div className="mut" style={{ fontSize: 12, marginTop: 6 }}>
          No modo automatico, resultados ligados a meta somam sozinhos. No manual, voce registra o avanco na mao.
        </div>
      </div>
      <button className="btn pri bloco" onClick={salvar}>Criar meta</button>
    </Folha>
  )
}
