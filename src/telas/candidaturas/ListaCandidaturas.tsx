// Lista de candidaturas por grupo (Aprovar, Enviadas, Entrevistas, Historico).
import { useState } from 'react'
import type { Candidatura, Vaga } from '../../types'
import { Vazio } from '../../componentes/comuns'
import { grupoDoStatus, type GrupoTela } from '../../logica/candidaturas/status'
import { hojeISO } from '../../utils/datas'
import { Detalhe } from './Detalhe'
import { Pill, StatusPill, dataBR } from './comum'

const VAZIO: Record<GrupoTela, string> = {
  vagas: '',
  aprovar: 'Nenhuma candidatura aguardando sua aprovacao.',
  enviadas: 'Nenhuma candidatura enviada ainda. Quando voce enviar uma, registre aqui.',
  entrevistas: 'Nenhuma entrevista ou teste registrado ainda.',
  historico: 'O historico esta vazio.',
}

export function ListaCandidaturas({ grupo, candidaturas, vagaPorId }: {
  grupo: GrupoTela
  candidaturas: Candidatura[]
  vagaPorId: Map<number, Vaga>
}) {
  const [aberta, setAberta] = useState<number | null>(null)
  const hoje = hojeISO()
  const itens = candidaturas
    .filter((c) => grupoDoStatus(c.status) === grupo)
    // Aprovadas (4) primeiro, depois as aguardando; as adiadas por ultimo.
    .sort((a, b) => (b.status - a.status) || ((a.adiadaEm ? 1 : 0) - (b.adiadaEm ? 1 : 0)) || (b.atualizadoEm - a.atualizadoEm))

  if (itens.length === 0) return <Vazio icone="vagas" texto={VAZIO[grupo]} />

  return (
    <>
      {itens.map((c) => {
        const v = vagaPorId.get(c.vagaId)
        const venceu = c.proximoFollowUp && c.proximoFollowUp <= hoje && c.status >= 5 && c.status <= 8
        return (
          <button key={c.id} className="cartao" style={{ width: '100%', textAlign: 'left', display: 'block' }} onClick={() => setAberta(c.id!)}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="sp">
                <div style={{ fontWeight: 700 }}>{v?.cargo ?? 'Vaga removida'}</div>
                <div className="mut" style={{ fontSize: 13.5 }}>{v?.empresa}</div>
              </div>
              <StatusPill status={c.status} />
            </div>
            <div className="linha-meta">
              {c.enviadaEm && <span>Enviada em {dataBR(c.enviadaEm)}</span>}
              {c.status === 3 && c.adiadaEm && <span>Salva para depois</span>}
              {c.status === 4 && <span>Falta voce enviar e registrar</span>}
              {c.camposPendentes.length > 0 && c.status <= 4 && <Pill cor="warn" texto={`${c.camposPendentes.length} pendente(s)`} />}
              {c.proximoFollowUp && c.status >= 5 && c.status <= 8 && (
                <Pill cor={venceu ? 'warn' : 'faint'} texto={`follow-up ${c.proximoFollowUp.split('-').reverse().join('/')}`} />
              )}
            </div>
          </button>
        )
      })}
      {aberta != null && <Detalhe id={aberta} onFechar={() => setAberta(null)} />}
    </>
  )
}
