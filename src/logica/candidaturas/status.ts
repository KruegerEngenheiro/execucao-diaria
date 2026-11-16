// Maquina de estados dos 11 status de candidatura. Logica pura.
// A regra mora aqui e no servico (servicos/candidaturas.ts), nunca so na tela.
import type { StatusCandidatura } from '../../types'

export const STATUS_ROTULO: Record<StatusCandidatura, string> = {
  1: 'Nova',
  2: 'Analisando',
  3: 'Aguardando aprovacao',
  4: 'Preparada',
  5: 'Enviada',
  6: 'Em avaliacao',
  7: 'Entrevista',
  8: 'Teste tecnico',
  9: 'Aprovado',
  10: 'Rejeitado',
  11: 'Encerrado',
}

export const TODOS_STATUS: StatusCandidatura[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

// Transicoes permitidas. As duas que dependem de uma acao propria tem guarda
// extra no servico:
//   3 -> 4 so por aprovar() (grava aprovadaEm)
//   4 -> 5 so por registrarEnvio() (exige 4 com aprovadaEm)
const TRANSICOES: Record<StatusCandidatura, StatusCandidatura[]> = {
  1: [2, 10, 11],
  2: [1, 3, 10, 11],
  3: [2, 4, 10, 11],
  4: [3, 5, 10, 11], // 4 -> 3: aprovacao revogada (edicao ou troca de curriculo)
  5: [6, 7, 8, 9, 10, 11],
  6: [7, 8, 9, 10, 11],
  7: [6, 8, 9, 10, 11],
  8: [6, 7, 9, 10, 11],
  9: [11],
  10: [11],
  11: [],
}

export function transicoesDe(de: StatusCandidatura): StatusCandidatura[] {
  return TRANSICOES[de] ?? []
}

export function podeTransitar(de: StatusCandidatura, para: StatusCandidatura): boolean {
  return transicoesDe(de).includes(para)
}

export function statusValido(n: unknown): n is StatusCandidatura {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 11
}

// Antes de existir candidatura, a vaga so passa por 1, 2 ou 11 (descartada).
export function statusPreCandidatura(s: StatusCandidatura): boolean {
  return s === 1 || s === 2
}

// Status em que a candidatura ja saiu do aparelho para a empresa.
export function foiEnviada(s: StatusCandidatura): boolean {
  return s >= 5 && s <= 9
}

export function encerrado(s: StatusCandidatura): boolean {
  return s === 9 || s === 10 || s === 11
}

// Cor semantica. ok=aprovado, warn=pendente/avaliacao, danger=rejeitado,
// accent=em andamento, faint=encerrado. Nota baixa nunca usa vermelho.
export type CorStatus = 'ok' | 'warn' | 'danger' | 'accent' | 'faint'

export function corDoStatus(s: StatusCandidatura): CorStatus {
  if (s === 9) return 'ok'
  if (s === 10) return 'danger'
  if (s === 11) return 'faint'
  if (s === 3 || s === 6) return 'warn'
  return 'accent'
}

// Agrupamento das sub-telas.
export type GrupoTela = 'vagas' | 'aprovar' | 'enviadas' | 'entrevistas' | 'historico'

export function grupoDoStatus(s: StatusCandidatura): GrupoTela {
  if (s === 1 || s === 2) return 'vagas'
  if (s === 3 || s === 4) return 'aprovar'
  if (s === 5 || s === 6) return 'enviadas'
  if (s === 7 || s === 8) return 'entrevistas'
  return 'historico'
}
