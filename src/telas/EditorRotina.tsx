// Editor da rotina. Alterar horario, categoria, janela, dias, ativar/desativar,
// criar e remover. Tambem cria excecao (pular) para um unico dia.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import type { Rotina, Janela } from '../types'
import { Folha } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import { useCategorias } from '../hooks/useCategorias'
import { hhmmParaMin, hojeISO } from '../utils/datas'

const JANELAS: Janela[] = ['FIXO', 'FLEXIVEL', 'FOCO', 'LIVRE', 'BLOQUEADO']
const DIAS = [['Dom', 0], ['Seg', 1], ['Ter', 2], ['Qua', 3], ['Qui', 4], ['Sex', 5], ['Sab', 6]] as const

export function EditorRotina({ onFechar }: { onFechar: () => void }) {
  const rotinas = useLiveQuery(() => db.rotinas.toArray(), [], [] as Rotina[]) ?? []
  const [editando, setEditando] = useState<Rotina | null>(null)
  const [novo, setNovo] = useState(false)
  const ordenadas = [...rotinas].sort((a, b) => hhmmParaMin(a.inicio) - hhmmParaMin(b.inicio))

  return (
    <Folha titulo="Editor de rotina" onFechar={onFechar}>
      <button className="btn pri bloco" onClick={() => setNovo(true)}><Icon nome="mais" tam={16} /> Nova atividade de rotina</button>
      <div style={{ height: 12 }} />
      {ordenadas.map((r) => (
        <div className="item" key={r.id} style={{ opacity: r.ativa ? 1 : 0.5 }}>
          <div className="hora">{r.inicio}</div>
          <div className="corpo" onClick={() => setEditando(r)}>
            <div className="tit">{r.titulo}</div>
            <div className="meta">{r.inicio} as {r.fim} · {r.categoria} · {r.dias.map((d) => DIAS.find((x) => x[1] === d)?.[0]).join(' ')}</div>
          </div>
          <span className={`tag-janela j-${r.janela}`}>{r.janela}</span>
        </div>
      ))}
      {(editando || novo) && (
        <FormRotina
          rotina={editando ?? undefined}
          onFechar={() => { setEditando(null); setNovo(false) }}
        />
      )}
    </Folha>
  )
}

function FormRotina({ rotina, onFechar }: { rotina?: Rotina; onFechar: () => void }) {
  const { lista } = useCategorias()
  const [titulo, setTitulo] = useState(rotina?.titulo ?? '')
  const [categoria, setCategoria] = useState(rotina?.categoria ?? 'Pessoal')
  const [janela, setJanela] = useState<Janela>(rotina?.janela ?? 'FIXO')
  const [inicio, setInicio] = useState(rotina?.inicio ?? '08:00')
  const [fim, setFim] = useState(rotina?.fim ?? '09:00')
  const [dias, setDias] = useState<number[]>(rotina?.dias ?? [1, 2, 3, 4, 5])
  const [nota, setNota] = useState(rotina?.nota ?? '')
  const [ativa, setAtiva] = useState(rotina?.ativa ?? true)
  const [dataExc, setDataExc] = useState(hojeISO())

  function toggleDia(d: number) {
    setDias((old) => old.includes(d) ? old.filter((x) => x !== d) : [...old, d].sort())
  }

  async function salvar() {
    if (!titulo.trim() || hhmmParaMin(fim) <= hhmmParaMin(inicio) || dias.length === 0) return
    const dados = { titulo: titulo.trim(), categoria, janela, inicio, fim, dias, nota: nota.trim() || undefined, ativa }
    if (rotina?.id) await db.rotinas.update(rotina.id, dados)
    else await db.rotinas.add({ ...dados, ordem: 999 })
    onFechar()
  }

  async function excluir() {
    if (rotina?.id && confirm('Remover esta atividade da rotina?')) { await db.rotinas.delete(rotina.id); onFechar() }
  }

  async function pularEm() {
    if (rotina?.id) {
      await db.excecoes.add({ rotinaId: rotina.id, data: dataExc, acao: 'pular' })
      alert('Pronto. Esta atividade vai pular nesse dia.')
    }
  }

  return (
    <Folha titulo={rotina ? 'Editar rotina' : 'Nova rotina'} onFechar={onFechar}>
      <div className="campo"><label>Atividade</label><input value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus /></div>
      <div className="grade-2">
        <div className="campo"><label>Comeca</label><input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
        <div className="campo"><label>Termina</label><input type="time" value={fim} onChange={(e) => setFim(e.target.value)} /></div>
      </div>
      <div className="campo">
        <label>Dias</label>
        <div className="chips">{DIAS.map(([r, d]) => <button key={d} className={`chip ${dias.includes(d) ? 'on' : ''}`} onClick={() => toggleDia(d)}>{r}</button>)}</div>
      </div>
      <div className="campo">
        <label>Categoria</label>
        <div className="chips">{lista.map((c) => <button key={c.id} className={`chip ${categoria === c.nome ? 'on' : ''}`} style={categoria === c.nome ? { background: c.cor } : undefined} onClick={() => setCategoria(c.nome)}>{c.nome}</button>)}</div>
      </div>
      <div className="campo">
        <label>Janela</label>
        <div className="chips">{JANELAS.map((j) => <button key={j} className={`chip ${janela === j ? 'on' : ''}`} onClick={() => setJanela(j)}>{j}</button>)}</div>
      </div>
      <div className="campo"><label>Nota (opcional)</label><input value={nota} onChange={(e) => setNota(e.target.value)} /></div>
      <div className="campo">
        <label className="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} style={{ width: 'auto' }} />
          <span>Ativa</span>
        </label>
      </div>
      <button className="btn pri bloco" onClick={salvar}>Salvar</button>

      {rotina && (
        <>
          <div className="titulo-secao">Pular em um dia especifico</div>
          <div className="row" style={{ gap: 8 }}>
            <input type="date" value={dataExc} onChange={(e) => setDataExc(e.target.value)} />
            <button className="btn" onClick={pularEm}>Pular</button>
          </div>
          <div style={{ height: 12 }} />
          <button className="btn perigo bloco" onClick={excluir}><Icon nome="lixo" tam={16} /> Remover da rotina</button>
        </>
      )}
    </Folha>
  )
}
