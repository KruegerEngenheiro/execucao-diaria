// Aba Vagas: central de candidaturas manual. Cadastrar vaga, aprovar, registrar
// envio e acompanhar. Nada e enviado pelo app: o envio e sempre do Carlos.
import { useState } from 'react'
import { Carregando, ErroBloco } from '../componentes/comuns'
import { Icon } from '../componentes/Icon'
import { contar } from '../logica/candidaturas/contagens'
import { FormVaga } from './candidaturas/FormVaga'
import { ListaVagas } from './candidaturas/ListaVagas'
import { ListaCandidaturas } from './candidaturas/ListaCandidaturas'
import { Resumo } from './candidaturas/Resumo'
import { useDadosCandidaturas, type SubVagas } from './candidaturas/comum'

export function Vagas({ sub, setSub }: { sub: SubVagas; setSub: (s: SubVagas) => void }) {
  const { estado, tentarDeNovo } = useDadosCandidaturas()
  const [nova, setNova] = useState(false)
  const [msg, setMsg] = useState('')

  const SUBS: { id: SubVagas; rotulo: string; n?: number }[] = [
    { id: 'resumo', rotulo: 'Resumo' },
    { id: 'vagas', rotulo: 'Vagas' },
    { id: 'aprovar', rotulo: 'Aprovar' },
    { id: 'enviadas', rotulo: 'Enviadas' },
    { id: 'entrevistas', rotulo: 'Entrevistas' },
    { id: 'historico', rotulo: 'Historico' },
  ]
  const c = estado.fase === 'ok' ? contar(estado.dados.vagas, estado.dados.candidaturas) : null
  const contador: Partial<Record<SubVagas, number>> = c
    ? { vagas: c.vagasNovas, aprovar: c.aguardandoAprovacao + c.preparadas }
    : {}

  return (
    <>
      <div className="cab">
        <div className="cab-linha">
          <h1>Vagas</h1>
          <button className="btn pri pequeno" onClick={() => setNova(true)}><Icon nome="mais" tam={16} /> Nova vaga</button>
        </div>
        <div className="sub">Voce decide e envia. O app organiza e registra.</div>
      </div>

      {/* Seis sub-telas nao cabem em 375px: a barra rola na horizontal. */}
      <div className="seg" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 14 }} role="tablist">
        {SUBS.map((s) => (
          <button key={s.id} role="tab" aria-selected={sub === s.id} className={sub === s.id ? 'on' : ''}
            style={{ flex: '0 0 auto', padding: '8px 12px', whiteSpace: 'nowrap' }} onClick={() => setSub(s.id)}>
            {s.rotulo}{contador[s.id] ? ` (${contador[s.id]})` : ''}
          </button>
        ))}
      </div>

      {msg && <div className="aviso ok" role="status">{msg}</div>}

      {estado.fase === 'carregando' && <Carregando />}
      {estado.fase === 'erro' && <ErroBloco texto="Nao consegui ler as vagas deste aparelho." onTentar={tentarDeNovo} />}
      {estado.fase === 'ok' && (
        <>
          {sub === 'resumo' && <Resumo dados={estado.dados} ir={setSub} />}
          {sub === 'vagas' && <ListaVagas vagas={estado.dados.vagas} irParaAprovar={() => setSub('aprovar')} />}
          {sub !== 'resumo' && sub !== 'vagas' && (
            <ListaCandidaturas grupo={sub} candidaturas={estado.dados.candidaturas} vagaPorId={estado.dados.vagaPorId} />
          )}
        </>
      )}

      {nova && (
        <FormVaga
          onFechar={() => setNova(false)}
          onCriada={(r, empresa) => {
            setMsg(r.possivelDuplicata
              ? `Vaga de ${empresa} salva. Atencao: ja existe uma vaga parecida (${r.possivelDuplicata.cargo}). Confira se nao e a mesma.`
              : `Vaga de ${empresa} salva na fila.`)
            setSub('vagas')
          }}
        />
      )}
    </>
  )
}
