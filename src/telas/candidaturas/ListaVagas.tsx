// Sub-tela "Vagas": vagas cadastradas que ainda nao viraram candidatura (status 1 e 2).
// Ainda nao ha nota de compatibilidade (vem em outra etapa), entao nao se chama
// "qualificada": e so a fila de vagas para o Carlos analisar.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db'
import type { Vaga } from '../../types'
import { Folha, ConfirmaAcao, Vazio, ErroBloco, Carregando } from '../../componentes/comuns'
import { descartarVaga, iniciarAnaliseVaga, prepararCandidatura, RegraViolada } from '../../servicos/candidaturas'
import { LinkExterno, Pill, StatusPill, ELEGIBILIDADE_ROTULO } from './comum'

export function ListaVagas({ vagas, irParaAprovar }: { vagas: Vaga[]; irParaAprovar: () => void }) {
  const fila = vagas.filter((v) => v.status === 1 || v.status === 2).sort((a, b) => b.criadoEm - a.criadoEm)
  const [preparar, setPreparar] = useState<Vaga | null>(null)
  const [descartar, setDescartar] = useState<Vaga | null>(null)
  const [erro, setErro] = useState('')

  async function analisar(v: Vaga) {
    setErro('')
    try { await iniciarAnaliseVaga(v.id!) } catch (e) { setErro(e instanceof RegraViolada ? e.message : 'Nao consegui atualizar a vaga.') }
  }

  if (fila.length === 0) return <Vazio icone="vagas" texto="Nenhuma vaga na fila. Use Nova vaga para cadastrar uma." />

  return (
    <>
      {erro && <ErroBloco texto={erro} />}
      {fila.map((v) => (
        <div className="cartao" key={v.id}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="sp">
              <div style={{ fontWeight: 700 }}>{v.cargo}</div>
              <div className="mut" style={{ fontSize: 13.5 }}>{v.empresa}{v.pais ? ` · ${v.pais}` : ''}</div>
            </div>
            <StatusPill status={v.status} />
          </div>
          <div className="linha-meta">
            <Pill cor={v.elegibilidade === 'desconhecida' ? 'warn' : 'accent'} texto={ELEGIBILIDADE_ROTULO[v.elegibilidade]} />
            <span>{v.plataforma}</span>
            {v.faixaSalarial && <span>{v.faixaSalarial}</span>}
          </div>
          {v.elegibilidadeEvidencia && <div className="mut" style={{ fontSize: 12.5, marginTop: 6 }}>Evidencia: "{v.elegibilidadeEvidencia}"</div>}
          <div className="linha-btns mt">
            {v.status === 1 && <button className="btn" onClick={() => analisar(v)}>Analisar</button>}
            <button className="btn pri" onClick={() => setPreparar(v)}>Preparar candidatura</button>
          </div>
          <div className="linha-btns" style={{ marginTop: 8 }}>
            <LinkExterno url={v.url} classe="btn pequeno" />
            <button className="btn pequeno perigo" onClick={() => setDescartar(v)}>Descartar</button>
          </div>
        </div>
      ))}

      {preparar && <EscolherCurriculo vaga={preparar} onFechar={() => setPreparar(null)} onPronto={() => { setPreparar(null); irParaAprovar() }} />}
      {descartar && (
        <ConfirmaAcao
          titulo="Descartar vaga" perigo rotuloConfirmar="Descartar"
          texto={`Descartar "${descartar.cargo}" em ${descartar.empresa}? Ela vai para o Historico.`}
          onCancelar={() => setDescartar(null)}
          onConfirmar={async () => { await descartarVaga(descartar.id!); setDescartar(null) }}
        />
      )}
    </>
  )
}

// Escolha entre os 2 curriculos reais. O sistema nao cria curriculo novo.
export function EscolherCurriculo({ vaga, onFechar, onPronto }: { vaga: Vaga; onFechar: () => void; onPronto: () => void }) {
  const [tentativa, setTentativa] = useState(0)
  const curriculos = useLiveQuery(async () => {
    try { return await db.curriculos.toArray() } catch { return null }
  }, [tentativa])
  const [escolhido, setEscolhido] = useState<number | undefined>()
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function criar() {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      await prepararCandidatura(vaga.id!, { curriculoId: escolhido })
      onPronto()
    } catch (e) {
      setErro(e instanceof RegraViolada ? e.message : 'Nao consegui preparar a candidatura.')
      setOcupado(false)
    }
  }

  return (
    <Folha titulo="Preparar candidatura" onFechar={onFechar}>
      <div className="mut" style={{ fontSize: 14, marginBottom: 12 }}>{vaga.cargo} em {vaga.empresa}</div>
      <div className="titulo-secao" style={{ marginTop: 0 }}>Curriculo</div>
      {curriculos === undefined && <Carregando />}
      {curriculos === null && <div style={{ marginBottom: 14 }}><ErroBloco texto="Nao consegui ler os curriculos deste aparelho." onTentar={() => setTentativa((n) => n + 1)} /></div>}
      <div className="chips" style={{ marginBottom: 14 }}>
        {(curriculos ?? []).map((c) => (
          <button key={c.id} className={`chip ${escolhido === c.id ? 'on' : ''}`} onClick={() => setEscolhido(c.id)}>{c.rotulo}</button>
        ))}
      </div>
      <div className="mut" style={{ fontSize: 12.5, marginBottom: 12 }}>Voce pode trocar depois. A candidatura vai para a aba Aprovar e nada e enviado.</div>
      {erro && <ErroBloco texto={erro} />}
      <button className="btn pri bloco" onClick={criar} disabled={ocupado}>{ocupado ? 'Criando...' : 'Criar candidatura'}</button>
    </Folha>
  )
}
