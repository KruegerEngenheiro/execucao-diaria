// Card da tela Hoje: o que pede acao do Carlos agora. Logica pura (padrao carreiraHoje).
import type { Candidatura } from '../../types'

export interface ResumoHojeCandidaturas {
  aguardandoAprovacao: number
  aprovadasSemEnvio: number
  followUpsVencidos: { candidaturaId: number; proximoFollowUp: string }[]
  tudoEmDia: boolean
}

export function resumoHojeCandidaturas(candidaturas: Candidatura[], hoje: string): ResumoHojeCandidaturas {
  const aguardandoAprovacao = candidaturas.filter((c) => c.status === 3).length
  const aprovadasSemEnvio = candidaturas.filter((c) => c.status === 4).length
  const followUpsVencidos = candidaturas
    .filter((c) => c.id != null && c.proximoFollowUp && c.proximoFollowUp <= hoje && c.status >= 5 && c.status <= 8)
    .map((c) => ({ candidaturaId: c.id!, proximoFollowUp: c.proximoFollowUp! }))
    .sort((a, b) => (a.proximoFollowUp < b.proximoFollowUp ? -1 : 1))
  return {
    aguardandoAprovacao, aprovadasSemEnvio, followUpsVencidos,
    tudoEmDia: aguardandoAprovacao === 0 && aprovadasSemEnvio === 0 && followUpsVencidos.length === 0,
  }
}
