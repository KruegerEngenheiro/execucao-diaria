// Contadores do Resumo. So CONTAGEM, nunca percentual: a taxa de conversao
// (E3) exige denominador definido, sem misturar pendente com resultado
// concluido (trava 6). Pendentes e concluidos ficam em campos separados de
// proposito, para o calculo honesto do E3 nascer ja separado.
import type { Candidatura, Vaga } from '../../types'

export interface Contagens {
  vagasNovas: number // status 1 e 2, sem candidatura
  aguardandoAprovacao: number // 3
  preparadas: number // 4
  enviadas: number // 5
  emAvaliacao: number // 6
  entrevistas: number // 7
  testes: number // 8
  aprovadas: number // 9
  rejeitadas: number // 10
  encerradas: number // 11
  pendentesDeResposta: number // 5 e 6: enviadas ainda sem desfecho
  comAvanco: number // 7, 8 e 9: a empresa respondeu com avanco
}

export function contar(vagas: Vaga[], candidaturas: Candidatura[]): Contagens {
  const n = (s: number) => candidaturas.filter((c) => c.status === s).length
  const c: Contagens = {
    vagasNovas: vagas.filter((v) => v.status === 1 || v.status === 2).length,
    aguardandoAprovacao: n(3), preparadas: n(4), enviadas: n(5), emAvaliacao: n(6),
    entrevistas: n(7), testes: n(8), aprovadas: n(9), rejeitadas: n(10), encerradas: n(11),
    pendentesDeResposta: 0, comAvanco: 0,
  }
  c.pendentesDeResposta = c.enviadas + c.emAvaliacao
  c.comAvanco = c.entrevistas + c.testes + c.aprovadas
  return c
}
