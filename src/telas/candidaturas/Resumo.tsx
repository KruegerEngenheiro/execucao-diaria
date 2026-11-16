// Sub-tela Resumo: so CONTAGENS. Nada de percentual de conversao aqui: a taxa
// precisa de denominador definido e de amostra minima (proxima etapa), e nunca
// pode misturar candidatura pendente com resultado concluido.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db'
import { Barra, ErroBloco } from '../../componentes/comuns'
import { contar } from '../../logica/candidaturas/contagens'
import { resumoHojeCandidaturas } from '../../logica/candidaturas/hoje'
import { criarMetaEntrevistas, RegraViolada, TITULO_META_ENTREVISTAS } from '../../servicos/candidaturas'
import { hojeISO } from '../../utils/datas'
import type { DadosCandidaturas, SubVagas } from './comum'

export function Resumo({ dados, ir }: { dados: DadosCandidaturas; ir: (s: SubVagas) => void }) {
  const c = contar(dados.vagas, dados.candidaturas)
  const hoje = resumoHojeCandidaturas(dados.candidaturas, hojeISO())
  const meta = useLiveQuery(async () => (await db.metas.filter((m) => m.titulo === TITULO_META_ENTREVISTAS).first()) ?? null, [])
  const [alvo, setAlvo] = useState('')
  const [erro, setErro] = useState('')

  async function criarMeta() {
    setErro('')
    try { await criarMetaEntrevistas(Number(alvo)) } catch (e) { setErro(e instanceof RegraViolada ? e.message : 'Nao consegui criar a meta.') }
  }

  const K = ({ v, r, para }: { v: number; r: string; para?: SubVagas }) => (
    <button className="kpi" onClick={para ? () => ir(para) : undefined} style={{ width: '100%' }}>
      <div className="v">{v}</div><div className="r">{r}</div>
    </button>
  )

  return (
    <>
      <div className="kpis">
        <K v={c.vagasNovas} r="Vagas na fila" para="vagas" />
        <K v={c.aguardandoAprovacao} r="Aguardam aprovacao" para="aprovar" />
        <K v={c.preparadas} r="Aprovadas, falta enviar" para="aprovar" />
      </div>
      <div className="kpis" style={{ marginTop: 10 }}>
        <K v={c.pendentesDeResposta} r="Enviadas, sem resposta" para="enviadas" />
        <K v={c.entrevistas + c.testes} r="Entrevista ou teste" para="entrevistas" />
        <K v={c.aprovadas} r="Contratadas" para="historico" />
      </div>
      <div className="mut" style={{ fontSize: 12.5, margin: '10px 2px 0', lineHeight: 1.4 }}>
        So contagens por enquanto. A taxa de conversao entra depois, com regra de amostra minima, para nao dar um numero bonito com a conta errada. Rejeitadas: {c.rejeitadas}. Encerradas: {c.encerradas}.
      </div>

      <div className="titulo-secao">Meta</div>
      <div className="cartao">
        {meta === undefined && <div className="mut">Carregando...</div>}
        {meta && (
          <>
            <div className="row"><div className="sp" style={{ fontWeight: 700 }}>{meta.titulo}</div><div className="mut nowrap">{meta.atual} / {meta.alvo}</div></div>
            <div style={{ marginTop: 8 }}><Barra pct={meta.alvo > 0 ? (meta.atual / meta.alvo) * 100 : 0} /></div>
          </>
        )}
        {meta === null && (
          <>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{TITULO_META_ENTREVISTAS}</div>
            <div className="mut" style={{ fontSize: 13.5, marginBottom: 10 }}>
              Defina quantas entrevistas voce quer. Cada entrevista marcada como qualificada soma 1, e as ja registradas entram na conta.
            </div>
            <div className="row">
              <input className="sp" type="number" min={1} value={alvo} onChange={(e) => setAlvo(e.target.value)} placeholder="Alvo, ex: 5"
                style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }} />
              <button className="btn pri" onClick={criarMeta} disabled={!Number(alvo)}>Criar meta</button>
            </div>
            {erro && <div style={{ marginTop: 10 }}><ErroBloco texto={erro} /></div>}
          </>
        )}
      </div>

      {hoje.followUpsVencidos.length > 0 && (
        <>
          <div className="titulo-secao">Follow-ups vencidos</div>
          <div className="aviso warn">{hoje.followUpsVencidos.length} candidatura(s) pedem follow-up. Abra Enviadas ou Entrevistas.</div>
        </>
      )}
    </>
  )
}
